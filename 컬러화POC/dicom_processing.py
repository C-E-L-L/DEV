"""DICOM pixel processing and ordinary image export helpers."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

import matplotlib
import numpy as np
import pydicom
from matplotlib.colors import LinearSegmentedColormap
from PIL import Image
from pydicom.dataset import Dataset
from pydicom.pixels import apply_modality_lut


NUCLEAR_SPECTRUM = LinearSegmentedColormap.from_list(
    "nuclear_spectrum",
    [
        (0.000, "#000000"),
        (0.015, "#000018"),
        (0.080, "#000080"),
        (0.220, "#0038ff"),
        (0.380, "#00b8ff"),
        (0.520, "#00dc20"),
        (0.680, "#a8f000"),
        (0.780, "#fff000"),
        (0.880, "#ff6200"),
        (0.940, "#ff0000"),
        (0.975, "#ff00b8"),
        (1.000, "#ffffff"),
    ],
    N=256,
)


def _get_colormap(name: str):
    if name == "nuclear_spectrum":
        return NUCLEAR_SPECTRUM
    try:
        return matplotlib.colormaps[name]
    except KeyError as exc:
        raise ValueError(f"알 수 없는 컬러맵입니다: {name}") from exc


@dataclass(frozen=True)
class DicomImage:
    """Pixel frames and non-identifying, display-related DICOM information."""

    frames: np.ndarray
    modality: str
    photometric_interpretation: str
    rows: int
    columns: int
    bits_stored: int | None
    metadata_window_center: float | None
    metadata_window_width: float | None


def _first_number(value: object) -> float | None:
    if value is None:
        return None
    try:
        if isinstance(value, (list, tuple)) or value.__class__.__name__ == "MultiValue":
            value = value[0]
        return float(value)
    except (TypeError, ValueError, IndexError):
        return None


def read_dicom_bytes(data: bytes) -> tuple[Dataset, DicomImage]:
    """Read a DICOM byte stream and return its display-ready intensity frames."""
    ds = pydicom.dcmread(BytesIO(data), force=True)
    if "PixelData" not in ds:
        raise ValueError("이 DICOM에는 표시할 PixelData가 없습니다.")

    try:
        pixels = np.asarray(ds.pixel_array)
    except Exception as exc:  # pydicom provides codec-specific details in the exception.
        raise ValueError(
            "픽셀 데이터를 해석하지 못했습니다. 압축 DICOM이라면 JPEG 디코더가 "
            "추가로 필요할 수 있습니다."
        ) from exc

    samples_per_pixel = int(getattr(ds, "SamplesPerPixel", 1) or 1)
    number_of_frames = int(getattr(ds, "NumberOfFrames", 1) or 1)

    # pydicom normally converts YBR data to RGB. For already-color images, map
    # luminance through the chosen colormap so the app has one consistent path.
    if samples_per_pixel > 1:
        if number_of_frames == 1:
            pixels = pixels[np.newaxis, ...]
        rgb = pixels[..., :3].astype(np.float32)
        pixels = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    else:
        pixels = np.asarray(apply_modality_lut(pixels, ds), dtype=np.float32)
        if number_of_frames == 1:
            pixels = pixels[np.newaxis, ...]

    if pixels.ndim != 3:
        raise ValueError(f"지원하지 않는 픽셀 배열 형식입니다: shape={pixels.shape}")

    image = DicomImage(
        frames=np.asarray(pixels, dtype=np.float32),
        modality=str(getattr(ds, "Modality", "Unknown")),
        photometric_interpretation=str(
            getattr(ds, "PhotometricInterpretation", "Unknown")
        ),
        rows=int(pixels.shape[-2]),
        columns=int(pixels.shape[-1]),
        bits_stored=(
            int(ds.BitsStored) if getattr(ds, "BitsStored", None) is not None else None
        ),
        metadata_window_center=_first_number(getattr(ds, "WindowCenter", None)),
        metadata_window_width=_first_number(getattr(ds, "WindowWidth", None)),
    )
    return ds, image


def suggested_window(
    frame: np.ndarray, metadata_center: float | None, metadata_width: float | None
) -> tuple[float, float, str]:
    """Choose the DICOM window when available, otherwise use robust percentiles."""
    if metadata_center is not None and metadata_width is not None and metadata_width > 0:
        return metadata_center, metadata_width, "DICOM Window Center/Width"

    finite = np.asarray(frame, dtype=np.float32)[np.isfinite(frame)]
    if finite.size == 0:
        raise ValueError("프레임에 유효한 픽셀 값이 없습니다.")

    low, high = np.percentile(finite, [1.0, 99.0])
    if high <= low:
        low, high = float(finite.min()), float(finite.max())
    if high <= low:
        high = low + 1.0
    return float((low + high) / 2.0), float(high - low), "자동 1–99 백분위"


def intensity_statistics(frame: np.ndarray) -> dict[str, float]:
    """Return useful finite-pixel statistics for display and initial controls."""
    finite = np.asarray(frame, dtype=np.float32)[np.isfinite(frame)]
    if finite.size == 0:
        raise ValueError("프레임에 유효한 픽셀 값이 없습니다.")
    p01, p99 = np.percentile(finite, [1.0, 99.0])
    return {
        "min": float(finite.min()),
        "max": float(finite.max()),
        "p01": float(p01),
        "p99": float(p99),
    }


def _linear_scale(frame: np.ndarray, low: float, high: float) -> np.ndarray:
    if not np.isfinite(low) or not np.isfinite(high) or high <= low:
        raise ValueError("정규화 상한값은 하한값보다 커야 합니다.")
    return np.clip((frame - low) / (high - low), 0.0, 1.0)


def normalize_frame(
    frame: np.ndarray,
    *,
    method: str = "linear",
    center: float | None = None,
    width: float | None = None,
    lower_percentile: float = 1.0,
    upper_percentile: float = 99.0,
    lower_bound: float | None = None,
    upper_bound: float | None = None,
    log_strength: float = 20.0,
) -> np.ndarray:
    """Normalize a DICOM intensity frame to the inclusive range 0..1.

    Supported methods are ``linear``, ``percentile``, ``window``,
    ``histogram`` and ``log``.
    """
    pixels = np.asarray(frame, dtype=np.float32)
    finite_mask = np.isfinite(pixels)
    finite = pixels[finite_mask]
    if finite.size == 0:
        raise ValueError("프레임에 유효한 픽셀 값이 없습니다.")

    clean = np.nan_to_num(
        pixels,
        nan=float(finite.min()),
        posinf=float(finite.max()),
        neginf=float(finite.min()),
    )
    data_min = float(finite.min())
    data_max = float(finite.max())
    if data_max <= data_min:
        return np.zeros_like(clean, dtype=np.float32)

    method = method.lower()
    if method == "linear":
        low = data_min if lower_bound is None else float(lower_bound)
        high = data_max if upper_bound is None else float(upper_bound)
        normalized = _linear_scale(clean, low, high)
    elif method == "percentile":
        if not 0.0 <= lower_percentile < upper_percentile <= 100.0:
            raise ValueError("백분위 범위는 0 ≤ 하한 < 상한 ≤ 100이어야 합니다.")
        low, high = np.percentile(finite, [lower_percentile, upper_percentile])
        if high <= low:
            low, high = data_min, data_max
        normalized = _linear_scale(clean, float(low), float(high))
    elif method == "window":
        if center is None or not np.isfinite(center):
            raise ValueError("윈도우 중심값은 유효한 숫자여야 합니다.")
        if width is None or not np.isfinite(width) or width <= 0:
            raise ValueError("윈도우 폭은 0보다 커야 합니다.")
        normalized = _linear_scale(
            clean, float(center) - float(width) / 2.0, float(center) + float(width) / 2.0
        )
    elif method == "histogram":
        linear = _linear_scale(clean, data_min, data_max)
        values = linear[finite_mask]
        hist, bin_edges = np.histogram(values, bins=1024, range=(0.0, 1.0))
        cdf = hist.cumsum().astype(np.float64)
        nonzero = np.flatnonzero(hist)
        if nonzero.size <= 1 or cdf[-1] <= cdf[nonzero[0]]:
            normalized = linear
        else:
            cdf_min = cdf[nonzero[0]]
            cdf = np.clip((cdf - cdf_min) / (cdf[-1] - cdf_min), 0.0, 1.0)
            normalized = np.interp(linear, bin_edges[:-1], cdf)
    elif method == "log":
        if not np.isfinite(log_strength) or log_strength <= 0:
            raise ValueError("Log 강도는 0보다 커야 합니다.")
        linear = _linear_scale(clean, data_min, data_max)
        normalized = np.log1p(float(log_strength) * linear) / np.log1p(
            float(log_strength)
        )
    else:
        raise ValueError(f"알 수 없는 정규화 방식입니다: {method}")

    return np.asarray(np.clip(normalized, 0.0, 1.0), dtype=np.float32)


def render_colormap(
    frame: np.ndarray,
    *,
    colormap: str,
    normalization: str = "linear",
    center: float | None = None,
    width: float | None = None,
    lower_percentile: float = 1.0,
    upper_percentile: float = 99.0,
    lower_bound: float | None = None,
    upper_bound: float | None = None,
    log_strength: float = 20.0,
    invert: bool = False,
    gamma: float = 1.0,
    background_threshold: float = 0.0,
) -> np.ndarray:
    """Normalize a frame, apply gamma and a colormap, and return uint8 RGB."""
    if not np.isfinite(gamma) or gamma <= 0:
        raise ValueError("감마는 0보다 커야 합니다.")
    if not np.isfinite(background_threshold) or not 0.0 <= background_threshold < 1.0:
        raise ValueError("배경 임계값은 0 이상 1 미만이어야 합니다.")

    normalized = normalize_frame(
        frame,
        method=normalization,
        center=center,
        width=width,
        lower_percentile=lower_percentile,
        upper_percentile=upper_percentile,
        lower_bound=lower_bound,
        upper_bound=upper_bound,
        log_strength=log_strength,
    )
    if invert:
        normalized = 1.0 - normalized
    background_mask = normalized <= background_threshold
    normalized = np.power(normalized, 1.0 / gamma)

    cmap = _get_colormap(colormap)
    rgb = cmap(normalized, bytes=True)[..., :3]
    if background_threshold > 0:
        rgb[background_mask] = 0
    return rgb


def make_colormap_scale(colormap: str, *, width: int = 512, height: int = 24) -> np.ndarray:
    """Return a horizontal RGB scale for the requested colormap."""
    gradient = np.tile(np.linspace(0.0, 1.0, width, dtype=np.float32), (height, 1))
    return _get_colormap(colormap)(gradient, bytes=True)[..., :3]


def encode_image(rgb: np.ndarray, image_format: str, *, jpeg_quality: int = 95) -> bytes:
    """Encode an RGB array as metadata-free PNG or JPEG bytes."""
    fmt = image_format.upper()
    if fmt not in {"PNG", "JPEG", "JPG"}:
        raise ValueError("내보내기 형식은 PNG 또는 JPG만 지원합니다.")
    if fmt == "JPG":
        fmt = "JPEG"

    output = BytesIO()
    image = Image.fromarray(np.asarray(rgb, dtype=np.uint8), mode="RGB")
    if fmt == "PNG":
        image.save(output, format="PNG", optimize=True)
    else:
        image.save(
            output,
            format="JPEG",
            quality=int(np.clip(jpeg_quality, 1, 100)),
            optimize=True,
            subsampling=0,
        )
    return output.getvalue()
