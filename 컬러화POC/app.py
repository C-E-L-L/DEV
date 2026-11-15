"""Local browser-based DICOM batch colormap viewer and exporter."""

from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import secrets
import shutil
import sqlite3
import tempfile
import threading
import time
import uuid
import webbrowser
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path, PurePosixPath
from typing import Any
from zipfile import ZIP_DEFLATED, ZipFile

import numpy as np
import pydicom
from flask import Flask, jsonify, render_template, request, send_file, session
from werkzeug.security import check_password_hash, generate_password_hash

from dicom_processing import (
    DicomImage,
    encode_image,
    intensity_statistics,
    make_colormap_scale,
    read_dicom_bytes,
    render_colormap,
    suggested_window,
)
from persistence import ColorizerStore


APP_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("COLORIZER_DATA_DIR", APP_DIR / "user_data")).resolve()
DATABASE_PATH = DATA_DIR / "colorizer.db"
UPLOAD_DIR = DATA_DIR / "uploads"
MAX_FILE_SIZE = 512 * 1024 * 1024
MAX_USER_STORAGE_BYTES = int(
    float(os.environ.get("COLORIZER_USER_STORAGE_LIMIT_GB", "10")) * 1024**3
)
MAX_IMAGE_CACHE_ITEMS = 12
JOB_TTL_SECONDS = 60 * 60
MAX_ROI_REGIONS = 500
MAX_POLYGON_POINTS = 2000
MAX_ROI_LABELS = 32
MAX_ROI_LABEL_LENGTH = 40
TIME_60_DURATION_MS = 60_000
TIME_60_TOLERANCE_MS = 500

ROI_LABELS = ("갑상샘", "병변", "배경", "기타")
SUPPORTED_ROI_SHAPES = {"polygon", "ellipse"}

SUPPORTED_NORMALIZATIONS = {"linear", "percentile", "histogram", "log", "window"}
SUPPORTED_COLORMAPS = {
    "nuclear_spectrum",
    "nipy_spectral",
    "gist_ncar",
    "turbo",
    "inferno",
    "magma",
    "plasma",
    "viridis",
    "hot",
    "cool",
    "jet",
    "bone",
    "gray",
}

DEFAULT_SETTINGS: dict[str, Any] = {
    "normalization": "linear",
    "colormap": "nuclear_spectrum",
    "invertGrayscale": True,
    "gamma": 1.35,
    "backgroundThreshold": 0.5,
    "manualBounds": False,
    "lowerBound": None,
    "upperBound": None,
    "lowerPercentile": 1.0,
    "upperPercentile": 99.0,
    "logStrength": 20.0,
    "center": None,
    "width": None,
    "format": "PNG",
    "jpegQuality": 95,
}


def default_acquisition_summary() -> dict[str, Any]:
    return {
        "type": "other",
        "label": None,
        "durationMs": None,
        "counts": None,
        "terminationCondition": None,
    }

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE + 16 * 1024 * 1024
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("COLORIZER_SECURE_COOKIE", "0") == "1",
    PERMANENT_SESSION_LIFETIME=60 * 60 * 24 * 30,
)


def _service_secret() -> str:
    configured = os.environ.get("COLORIZER_SECRET_KEY", "").strip()
    if configured:
        return configured
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    secret_path = DATA_DIR / ".session-secret"
    if secret_path.exists():
        return secret_path.read_text(encoding="utf-8").strip()
    generated = secrets.token_urlsafe(48)
    secret_path.write_text(generated, encoding="utf-8")
    return generated


app.secret_key = _service_secret()
store = ColorizerStore(DATABASE_PATH)
store.initialize()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

_runtime_directory = tempfile.TemporaryDirectory(prefix="dicom-colorizer-")
RUNTIME_DIR = Path(_runtime_directory.name).resolve()
JOB_DIR = RUNTIME_DIR / "jobs"
JOB_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class BatchItem:
    item_id: str
    batch_id: str
    user_id: str
    relative_path: str
    original_relative_path: str
    source_path: Path
    content_hash: str
    image_hash: str | None = None
    error: str | None = None
    acquisition: dict[str, Any] = field(default_factory=default_acquisition_summary)
    lock: Any = field(default_factory=threading.RLock, repr=False)


@dataclass
class Batch:
    batch_id: str
    user_id: str
    label: str
    source_type: str
    items: OrderedDict[str, BatchItem] = field(default_factory=OrderedDict)
    created_at: float = field(default_factory=time.time)


@dataclass
class ExportJob:
    job_id: str
    batch_id: str
    user_id: str
    job_type: str = "images"
    format: str = "PNG"
    jpeg_quality: int = 95
    status: str = "queued"
    processed_files: int = 0
    total_files: int = 0
    current_file: str = ""
    error_count: int = 0
    message: str = "작업 대기 중"
    error: str | None = None
    result_path: Path | None = None
    created_at: float = field(default_factory=time.time)
    finished_at: float | None = None
    cancel_event: threading.Event = field(default_factory=threading.Event, repr=False)


_state_lock = threading.RLock()
_settings_lock = threading.RLock()
_annotations_lock = threading.RLock()
_storage_lock = threading.RLock()
_batches: dict[str, Batch] = {}
_items: dict[str, BatchItem] = {}
_image_cache: OrderedDict[str, DicomImage] = OrderedDict()
_jobs: dict[str, ExportJob] = {}
_job_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="dicom-export")


def configure_data_directory(path: Path) -> None:
    """Reconfigure persistence for tests or an embedded deployment."""
    global DATA_DIR, DATABASE_PATH, UPLOAD_DIR, store
    DATA_DIR = Path(path).resolve()
    DATABASE_PATH = DATA_DIR / "colorizer.db"
    UPLOAD_DIR = DATA_DIR / "uploads"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    store = ColorizerStore(DATABASE_PATH)
    store.initialize()
    backfill_missing_acquisition_summaries()
    with _state_lock:
        _batches.clear()
        _items.clear()
        _image_cache.clear()
        _jobs.clear()


def current_user_id() -> str:
    user_id = session.get("colorizer_user_id")
    if not user_id:
        raise PermissionError("로그인이 필요합니다.")
    return str(user_id)


def _optional_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    result = float(value)
    if not np.isfinite(result):
        raise ValueError("설정값은 유효한 숫자여야 합니다.")
    return result


def canonical_settings(payload: dict[str, Any], *, default_invert: bool = True) -> dict[str, Any]:
    settings = dict(DEFAULT_SETTINGS)
    settings["invertGrayscale"] = default_invert
    for key in settings:
        if key in payload:
            settings[key] = payload[key]

    settings["normalization"] = str(settings["normalization"]).lower()
    if settings["normalization"] not in SUPPORTED_NORMALIZATIONS:
        raise ValueError("지원하지 않는 정규화 방식입니다.")
    settings["colormap"] = str(settings["colormap"])
    if settings["colormap"] not in SUPPORTED_COLORMAPS:
        raise ValueError("지원하지 않는 컬러맵입니다.")
    settings["format"] = str(settings["format"]).upper()
    if settings["format"] not in {"PNG", "JPG"}:
        raise ValueError("내보내기 형식은 PNG 또는 JPG여야 합니다.")

    settings["invertGrayscale"] = bool(settings["invertGrayscale"])
    settings["manualBounds"] = bool(settings["manualBounds"])
    settings["gamma"] = float(settings["gamma"])
    settings["backgroundThreshold"] = float(settings["backgroundThreshold"])
    settings["lowerPercentile"] = float(settings["lowerPercentile"])
    settings["upperPercentile"] = float(settings["upperPercentile"])
    settings["logStrength"] = float(settings["logStrength"])
    settings["jpegQuality"] = int(settings["jpegQuality"])
    settings["lowerBound"] = _optional_float(settings["lowerBound"])
    settings["upperBound"] = _optional_float(settings["upperBound"])
    settings["center"] = _optional_float(settings["center"])
    settings["width"] = _optional_float(settings["width"])

    if not 0.2 <= settings["gamma"] <= 3.0:
        raise ValueError("감마 값이 허용 범위를 벗어났습니다.")
    if not 0.0 <= settings["backgroundThreshold"] < 100.0:
        raise ValueError("배경 임계값이 허용 범위를 벗어났습니다.")
    if not 0.0 <= settings["lowerPercentile"] < settings["upperPercentile"] <= 100.0:
        raise ValueError("백분위 범위가 올바르지 않습니다.")
    if settings["logStrength"] <= 0:
        raise ValueError("Log 강조 정도는 0보다 커야 합니다.")
    if not 1 <= settings["jpegQuality"] <= 100:
        raise ValueError("JPG 품질은 1~100 사이여야 합니다.")
    if settings["normalization"] != "linear" or not settings["manualBounds"]:
        settings["manualBounds"] = False
        settings["lowerBound"] = None
        settings["upperBound"] = None
    if settings["normalization"] != "window":
        settings["center"] = None
        settings["width"] = None
    return settings


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def configured_roi_labels(user_id: str) -> list[str]:
    with _annotations_lock:
        labels = store.list_labels(user_id)
        return labels or list(ROI_LABELS)


def canonical_roi_label(value: Any) -> str:
    label = str(value or "").strip()
    if not label:
        raise ValueError("ROI 라벨 이름을 입력해 주세요.")
    if len(label) > MAX_ROI_LABEL_LENGTH:
        raise ValueError(f"ROI 라벨 이름은 {MAX_ROI_LABEL_LENGTH}자 이하로 입력해 주세요.")
    if any(character in label for character in "\r\n\t"):
        raise ValueError("ROI 라벨 이름에는 줄바꿈이나 탭을 사용할 수 없습니다.")
    return label


def migrate_legacy_json_for_first_user(user_id: str) -> None:
    """Assign the former single-user JSON state to the first service account."""
    with _storage_lock:
        if store.metadata_value("legacy_json_imported") is not None:
            return
        settings_path = DATA_DIR / "color_settings.json"
        annotations_path = DATA_DIR / "roi_annotations.json"

        if settings_path.exists():
            try:
                legacy_settings = json.loads(settings_path.read_text(encoding="utf-8"))
                for content_hash, payload in legacy_settings.get("settingsByHash", {}).items():
                    store.save_settings(
                        user_id,
                        str(content_hash),
                        canonical_settings(payload),
                        utc_timestamp(),
                    )
            except (OSError, ValueError, TypeError, json.JSONDecodeError):
                pass

        if annotations_path.exists():
            try:
                legacy_annotations = json.loads(
                    annotations_path.read_text(encoding="utf-8")
                )
                labels: list[str] = []
                for value in legacy_annotations.get("labels", []):
                    label = canonical_roi_label(value)
                    if label.casefold() not in {existing.casefold() for existing in labels}:
                        labels.append(label)
                if labels:
                    store.replace_labels(user_id, labels[:MAX_ROI_LABELS])
                for content_hash, saved in legacy_annotations.get(
                    "annotationsByHash", {}
                ).items():
                    if not isinstance(saved, dict):
                        continue
                    rows = int(saved.get("rows", 0))
                    columns = int(saved.get("columns", 0))
                    regions = saved.get("regions", [])
                    if rows <= 0 or columns <= 0 or not isinstance(regions, list):
                        continue
                    store.save_annotations(
                        user_id,
                        str(content_hash),
                        rows,
                        columns,
                        {
                            "regions": regions,
                            "colorSettingsSnapshot": canonical_settings(
                                saved.get("colorSettingsSnapshot") or DEFAULT_SETTINGS
                            ),
                        },
                        str(saved.get("updatedAt") or utc_timestamp()),
                    )
            except (OSError, ValueError, TypeError, json.JSONDecodeError):
                pass

        store.save_metadata("legacy_json_imported", user_id)


def _integer_coordinate(value: Any, maximum: int, name: str) -> int:
    if isinstance(value, bool):
        raise ValueError(f"{name} 좌표는 정수여야 합니다.")
    try:
        numeric = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} 좌표는 정수여야 합니다.") from exc
    if not np.isfinite(numeric) or not numeric.is_integer():
        raise ValueError(f"{name} 좌표는 정수여야 합니다.")
    coordinate = int(numeric)
    if not 0 <= coordinate < maximum:
        raise ValueError(f"{name} 좌표가 영상 범위를 벗어났습니다.")
    return coordinate


def canonical_regions(
    payload: Any, image: DicomImage, user_id: str
) -> list[dict[str, Any]]:
    if not isinstance(payload, list):
        raise ValueError("ROI 목록 형식이 올바르지 않습니다.")
    if len(payload) > MAX_ROI_REGIONS:
        raise ValueError(f"ROI는 파일당 최대 {MAX_ROI_REGIONS}개까지 저장할 수 있습니다.")

    allowed_labels = set(configured_roi_labels(user_id))
    regions: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for index, raw in enumerate(payload, start=1):
        if not isinstance(raw, dict):
            raise ValueError(f"{index}번째 ROI 형식이 올바르지 않습니다.")
        shape = str(raw.get("shape", "")).lower()
        if shape not in SUPPORTED_ROI_SHAPES:
            raise ValueError(f"{index}번째 ROI 도형을 지원하지 않습니다.")
        label = str(raw.get("label", ""))
        if label not in allowed_labels:
            raise ValueError(f"{index}번째 ROI 라벨이 허용 목록에 없습니다.")
        region_id = str(raw.get("id") or uuid.uuid4().hex)[:64]
        if not region_id or region_id in seen_ids:
            region_id = uuid.uuid4().hex
        seen_ids.add(region_id)

        if shape == "polygon":
            raw_points = raw.get("points")
            if not isinstance(raw_points, list) or not 3 <= len(raw_points) <= MAX_POLYGON_POINTS:
                raise ValueError(
                    f"{index}번째 다각형은 3~{MAX_POLYGON_POINTS}개의 꼭짓점이 필요합니다."
                )
            points: list[list[int]] = []
            for point_index, point in enumerate(raw_points, start=1):
                if not isinstance(point, (list, tuple)) or len(point) != 2:
                    raise ValueError(
                        f"{index}번째 ROI의 {point_index}번째 꼭짓점 형식이 올바르지 않습니다."
                    )
                points.append(
                    [
                        _integer_coordinate(point[0], image.columns, "X"),
                        _integer_coordinate(point[1], image.rows, "Y"),
                    ]
                )
            if len({tuple(point) for point in points}) < 3:
                raise ValueError(f"{index}번째 다각형에는 서로 다른 꼭짓점이 3개 이상 필요합니다.")
            regions.append(
                {"id": region_id, "shape": shape, "label": label, "points": points}
            )
            continue

        cx = _integer_coordinate(raw.get("cx"), image.columns, "중심 X")
        cy = _integer_coordinate(raw.get("cy"), image.rows, "중심 Y")
        rx = _integer_coordinate(raw.get("rx"), image.columns, "반지름 X")
        ry = _integer_coordinate(raw.get("ry"), image.rows, "반지름 Y")
        if rx <= 0 or ry <= 0:
            raise ValueError(f"{index}번째 타원의 반지름은 0보다 커야 합니다.")
        if cx - rx < 0 or cx + rx >= image.columns or cy - ry < 0 or cy + ry >= image.rows:
            raise ValueError(f"{index}번째 타원이 영상 범위를 벗어났습니다.")
        regions.append(
            {
                "id": region_id,
                "shape": shape,
                "label": label,
                "cx": cx,
                "cy": cy,
                "rx": rx,
                "ry": ry,
            }
        )
    return regions


def saved_annotations_for(item: BatchItem) -> dict[str, Any] | None:
    with _annotations_lock:
        saved = store.get_annotations(item.user_id, item.content_hash)
        return json.loads(json.dumps(saved)) if saved is not None else None


def annotation_summary(item: BatchItem, image: DicomImage) -> dict[str, Any]:
    saved = saved_annotations_for(item)
    if saved is not None and (
        saved.get("rows") != image.rows or saved.get("columns") != image.columns
    ):
        raise ValueError("저장된 ROI의 영상 크기가 현재 DICOM과 일치하지 않습니다.")
    return {
        "contentHash": item.content_hash,
        "rows": image.rows,
        "columns": image.columns,
        "labels": configured_roi_labels(item.user_id),
        "regions": saved.get("regions", []) if saved else [],
        "colorSettingsSnapshot": saved.get("colorSettingsSnapshot") if saved else None,
        "updatedAt": saved.get("updatedAt") if saved else None,
    }


def render_parameters(settings: dict[str, Any]) -> dict[str, Any]:
    return {
        "normalization": settings["normalization"],
        "center": settings["center"],
        "width": settings["width"],
        "lower_percentile": settings["lowerPercentile"],
        "upper_percentile": settings["upperPercentile"],
        "lower_bound": settings["lowerBound"] if settings["manualBounds"] else None,
        "upper_bound": settings["upperBound"] if settings["manualBounds"] else None,
        "log_strength": settings["logStrength"],
        "gamma": settings["gamma"],
        "background_threshold": settings["backgroundThreshold"] / 100.0,
    }


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def user_storage_bytes(user_id: str) -> int:
    user_directory = (UPLOAD_DIR / user_id).resolve()
    try:
        user_directory.relative_to(UPLOAD_DIR)
    except ValueError as exc:
        raise ValueError("사용자 저장 경로가 올바르지 않습니다.") from exc
    if not user_directory.exists():
        return 0
    return sum(path.stat().st_size for path in user_directory.rglob("*") if path.is_file())


def save_uploaded_file(uploaded: Any, destination: Path, user_id: str) -> str:
    with _storage_lock:
        used_bytes = user_storage_bytes(user_id)
        size = 0
        digest = hashlib.sha256()
        try:
            with destination.open("wb") as output:
                while True:
                    chunk = uploaded.stream.read(1024 * 1024)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > MAX_FILE_SIZE:
                        raise ValueError("파일당 최대 크기 512MB를 초과했습니다.")
                    if used_bytes + size > MAX_USER_STORAGE_BYTES:
                        limit_gb = MAX_USER_STORAGE_BYTES / 1024**3
                        raise ValueError(
                            f"계정 저장공간 제한({limit_gb:g}GB)을 초과했습니다. 기존 작업을 정리해 주세요."
                        )
                    digest.update(chunk)
                    output.write(chunk)
        except Exception:
            destination.unlink(missing_ok=True)
            raise
    return digest.hexdigest()


def clean_relative_path(raw_path: str, fallback_name: str) -> str:
    normalized = str(raw_path or fallback_name).replace("\\", "/").strip()
    pure = PurePosixPath(normalized)
    if pure.is_absolute() or not pure.parts or any(part in {"", ".", ".."} for part in pure.parts):
        raise ValueError("파일의 상대 경로가 올바르지 않습니다.")
    if pure.suffix.lower() not in {".dcm", ".dicom"}:
        raise ValueError(".dcm 또는 .dicom 파일만 불러올 수 있습니다.")
    return pure.as_posix()


def unique_relative_path(batch: Batch, relative_path: str) -> str:
    existing = {item.relative_path.casefold() for item in batch.items.values()}
    if relative_path.casefold() not in existing:
        return relative_path
    pure = PurePosixPath(relative_path)
    counter = 2
    while True:
        candidate = (pure.parent / f"{pure.stem}__{counter}{pure.suffix}").as_posix()
        if candidate.casefold() not in existing:
            return candidate
        counter += 1


def clean_item_filename(raw_name: Any, current_path: str) -> str:
    filename = str(raw_name or "").strip()
    if not filename:
        raise ValueError("새 파일 이름을 입력해 주세요.")
    if filename in {".", ".."} or "/" in filename or "\\" in filename:
        raise ValueError("폴더 경로를 제외한 파일 이름만 입력해 주세요.")
    if re.search(r'[<>:"|?*\x00-\x1f]', filename) or filename.endswith((" ", ".")):
        raise ValueError("파일 이름에 사용할 수 없는 문자가 포함되어 있습니다.")
    if len(filename) > 255:
        raise ValueError("파일 이름은 255자 이하여야 합니다.")

    current_suffix = PurePosixPath(current_path).suffix
    candidate = PurePosixPath(filename)
    if not candidate.suffix:
        filename += current_suffix
        candidate = PurePosixPath(filename)
    if candidate.suffix.lower() not in {".dcm", ".dicom"}:
        raise ValueError("파일 확장자는 .dcm 또는 .dicom이어야 합니다.")
    if not candidate.stem.strip(" ."):
        raise ValueError("파일 이름을 입력해 주세요.")
    return filename


def renamed_relative_path(batch: Batch, item: BatchItem, raw_name: Any) -> str:
    filename = clean_item_filename(raw_name, item.relative_path)
    candidate = (PurePosixPath(item.relative_path).parent / filename).as_posix()
    for other in batch.items.values():
        if other.item_id != item.item_id and other.relative_path.casefold() == candidate.casefold():
            raise ValueError("같은 폴더에 동일한 파일 이름이 이미 있습니다.")
    return candidate


IMAGE_FINGERPRINT_FIELDS = (
    "Rows",
    "Columns",
    "NumberOfFrames",
    "SamplesPerPixel",
    "PhotometricInterpretation",
    "BitsAllocated",
    "BitsStored",
    "HighBit",
    "PixelRepresentation",
    "PlanarConfiguration",
    "RescaleSlope",
    "RescaleIntercept",
    "WindowCenter",
    "WindowWidth",
)


def _dicom_numeric_value(value: Any) -> int | float | None:
    if value in (None, ""):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError, OverflowError):
        return None
    if not np.isfinite(number):
        return None
    return int(number) if number.is_integer() else number


def dicom_acquisition_summary(dataset: Any) -> dict[str, Any]:
    duration_ms = _dicom_numeric_value(getattr(dataset, "ActualFrameDuration", None))
    counts = _dicom_numeric_value(getattr(dataset, "CountsAccumulated", None))
    termination_value = getattr(dataset, "AcquisitionTerminationCondition", None)
    termination_condition = str(termination_value).strip() if termination_value is not None else None
    if not termination_condition:
        termination_condition = None

    acquisition_type = "other"
    label = None
    if (
        duration_ms is not None
        and TIME_60_DURATION_MS - TIME_60_TOLERANCE_MS
        <= duration_ms
        <= TIME_60_DURATION_MS + TIME_60_TOLERANCE_MS
    ):
        acquisition_type = "time60"
        label = "60 sec"
    elif counts == 200_000:
        acquisition_type = "counts200000"
        label = "200,000"

    return {
        "type": acquisition_type,
        "label": label,
        "durationMs": duration_ms,
        "counts": counts,
        "terminationCondition": termination_condition,
    }


def backfill_missing_acquisition_summaries() -> dict[str, int]:
    missing_records = store.list_items_missing_acquisition()
    updates: list[tuple[str, dict[str, Any]]] = []
    skipped = 0

    for record in missing_records:
        source_path = (DATA_DIR / str(record["storage_path"])).resolve()
        try:
            source_path.relative_to(DATA_DIR)
        except ValueError:
            skipped += 1
            continue
        if not source_path.is_file():
            skipped += 1
            continue
        try:
            dataset = pydicom.dcmread(source_path, force=True, stop_before_pixels=True)
            acquisition = dicom_acquisition_summary(dataset)
        except Exception:
            skipped += 1
            continue
        updates.append((str(record["id"]), acquisition))

    updated = store.update_item_acquisitions(updates)
    if missing_records:
        app.logger.info(
            "DICOM acquisition backfill finished: missing=%d updated=%d skipped=%d",
            len(missing_records),
            updated,
            skipped,
        )
    return {"missing": len(missing_records), "updated": updated, "skipped": skipped}


backfill_missing_acquisition_summaries()


def inspect_dicom_image(
    path: Path,
) -> tuple[str | None, str | None, dict[str, Any]]:
    acquisition = default_acquisition_summary()
    try:
        dataset = pydicom.dcmread(path, force=True, defer_size=1024)
        acquisition = dicom_acquisition_summary(dataset)
        if "PixelData" not in dataset:
            return "PixelData가 없는 DICOM 파일입니다.", None, acquisition
        fingerprint = hashlib.sha256()
        interpretation = {
            keyword: str(getattr(dataset, keyword, ""))
            for keyword in IMAGE_FINGERPRINT_FIELDS
        }
        fingerprint.update(
            json.dumps(
                interpretation,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            ).encode("utf-8")
        )
        fingerprint.update(b"\0PIXELDATA\0")
        fingerprint.update(bytes(dataset.PixelData))
        return None, fingerprint.hexdigest(), acquisition
    except Exception as exc:
        return f"DICOM 헤더를 읽을 수 없습니다: {exc}", None, acquisition


def create_batch(label: str, source_type: str, user_id: str) -> Batch:
    batch = Batch(
        batch_id=uuid.uuid4().hex,
        user_id=user_id,
        label=label,
        source_type=source_type,
    )
    store.create_batch(
        {
            "id": batch.batch_id,
            "user_id": user_id,
            "label": label,
            "source_type": source_type,
            "created_at": batch.created_at,
        }
    )
    with _state_lock:
        _batches[batch.batch_id] = batch
    return batch


def add_batch_item(
    batch: Batch,
    source_path: Path,
    relative_path: str,
    *,
    content_hash: str | None = None,
) -> BatchItem:
    relative_path = unique_relative_path(batch, relative_path)
    error, image_hash, acquisition = inspect_dicom_image(source_path)
    item = BatchItem(
        item_id=uuid.uuid4().hex,
        batch_id=batch.batch_id,
        user_id=batch.user_id,
        relative_path=relative_path,
        original_relative_path=relative_path,
        source_path=source_path,
        content_hash=content_hash or hash_file(source_path),
        image_hash=image_hash,
        error=error,
        acquisition=acquisition,
    )
    store.create_item(
        {
            "id": item.item_id,
            "batch_id": batch.batch_id,
            "user_id": batch.user_id,
            "relative_path": relative_path,
            "original_relative_path": relative_path,
            "storage_path": source_path.resolve().relative_to(DATA_DIR).as_posix(),
            "content_hash": item.content_hash,
            "image_hash": image_hash,
            "error": error,
            "acquisition": acquisition,
            "created_at": time.time(),
        }
    )
    with _state_lock:
        batch.items[item.item_id] = item
        _items[item.item_id] = item
    return item


def _item_from_record(record: dict[str, Any]) -> BatchItem:
    source_path = (DATA_DIR / str(record["storage_path"])).resolve()
    try:
        source_path.relative_to(DATA_DIR)
    except ValueError as exc:
        raise ValueError("저장된 파일 경로가 올바르지 않습니다.") from exc
    return BatchItem(
        item_id=str(record["id"]),
        batch_id=str(record["batch_id"]),
        user_id=str(record["user_id"]),
        relative_path=str(record["relative_path"]),
        original_relative_path=str(
            record.get("original_relative_path") or record["relative_path"]
        ),
        source_path=source_path,
        content_hash=str(record["content_hash"]),
        image_hash=record.get("image_hash"),
        error=record.get("error"),
        acquisition=record.get("acquisition") or default_acquisition_summary(),
    )


def _load_batch(batch_id: str) -> Batch | None:
    record = store.batch_by_id(batch_id)
    if record is None:
        return None
    batch = Batch(
        batch_id=str(record["id"]),
        user_id=str(record["user_id"]),
        label=str(record["label"]),
        source_type=str(record["source_type"]),
        created_at=float(record["created_at"]),
    )
    for item_record in store.list_items(batch.batch_id):
        item = _item_from_record(item_record)
        batch.items[item.item_id] = item
    with _state_lock:
        _batches[batch.batch_id] = batch
        _items.update(batch.items)
    return batch


def get_batch(batch_id: str, user_id: str | None = None) -> Batch:
    with _state_lock:
        batch = _batches.get(batch_id)
    if batch is None:
        batch = _load_batch(batch_id)
    if batch is None:
        raise ValueError("파일 작업 목록을 찾을 수 없습니다.")
    if user_id is not None and batch.user_id != user_id:
        raise ValueError("파일 작업 목록을 찾을 수 없습니다.")
    return batch


def get_item(item_id: str, user_id: str | None = None) -> BatchItem:
    with _state_lock:
        item = _items.get(item_id)
    if item is None:
        record = store.item_by_id(item_id)
        if record is not None:
            item = _item_from_record(record)
            with _state_lock:
                _items[item.item_id] = item
    if item is None:
        raise ValueError("파일 항목을 찾을 수 없습니다.")
    if user_id is not None and item.user_id != user_id:
        raise ValueError("파일 항목을 찾을 수 없습니다.")
    return item


def saved_settings_for(item: BatchItem) -> dict[str, Any] | None:
    with _settings_lock:
        saved = store.get_settings(item.user_id, item.content_hash)
        return dict(saved) if saved is not None else None


def item_summary(item: BatchItem) -> dict[str, Any]:
    saved = saved_settings_for(item)
    annotations = saved_annotations_for(item)
    return {
        "itemId": item.item_id,
        "relativePath": item.relative_path,
        "originalRelativePath": item.original_relative_path,
        "contentHash": item.content_hash,
        "imageHash": item.image_hash,
        "error": item.error,
        "acquisition": item.acquisition,
        "savedSettings": saved,
        "roiCount": len(annotations.get("regions", [])) if annotations else 0,
    }


def batch_summary(batch: Batch) -> dict[str, Any]:
    return {
        "batchId": batch.batch_id,
        "label": batch.label,
        "sourceType": batch.source_type,
        "createdAt": datetime.fromtimestamp(batch.created_at, timezone.utc).isoformat(),
        "itemCount": len(batch.items),
        "items": [item_summary(item) for item in batch.items.values()],
    }


def load_item_image(item: BatchItem) -> DicomImage:
    if item.error:
        raise ValueError(item.error)
    with item.lock:
        with _state_lock:
            cached = _image_cache.pop(item.item_id, None)
            if cached is not None:
                _image_cache[item.item_id] = cached
                return cached
        try:
            if not item.source_path.exists():
                raise ValueError("서버에 저장된 원본 DICOM 파일을 찾을 수 없습니다.")
            _dataset, image = read_dicom_bytes(item.source_path.read_bytes())
        except Exception as exc:
            item.error = str(exc)
            store.update_item_error(item.item_id, item.error)
            raise ValueError(item.error) from exc
        with _state_lock:
            _image_cache[item.item_id] = image
            while len(_image_cache) > MAX_IMAGE_CACHE_ITEMS:
                _image_cache.popitem(last=False)
        return image


def image_information(image: DicomImage) -> dict[str, Any]:
    pixels = image.frames[0]
    stats = intensity_statistics(pixels)
    center, width, window_source = suggested_window(
        pixels,
        image.metadata_window_center,
        image.metadata_window_width,
    )
    return {
        "stats": stats,
        "window": {"center": center, "width": width, "source": window_source},
    }


def source_information(item: BatchItem, image: DicomImage) -> dict[str, Any]:
    return {
        **item_summary(item),
        "filename": Path(item.relative_path).name,
        "rows": image.rows,
        "columns": image.columns,
        "modality": image.modality,
        "photometricInterpretation": image.photometric_interpretation,
        "bitsStored": image.bits_stored,
        "defaultInvert": True,
        **image_information(image),
    }


def image_data_url(rgb: np.ndarray) -> str:
    encoded = encode_image(rgb, "PNG")
    return "data:image/png;base64," + base64.b64encode(encoded).decode("ascii")


def safe_stem(relative_path: str) -> str:
    return Path(relative_path).stem or "dicom"


def item_download_name(item: BatchItem, settings: dict[str, Any]) -> str:
    extension = settings["format"].lower()
    return f"{safe_stem(item.relative_path)}_colored.{extension}"


def render_color_image(image: DicomImage, settings: dict[str, Any]) -> np.ndarray:
    return render_colormap(
        image.frames[0],
        colormap=settings["colormap"],
        invert=False,
        **render_parameters(settings),
    )


def archive_base_path(item: BatchItem) -> PurePosixPath:
    relative = PurePosixPath(item.relative_path)
    return relative.parent / relative.stem


def via_region(region: dict[str, Any]) -> dict[str, Any]:
    if region["shape"] == "polygon":
        shape_attributes = {
            "name": "polygon",
            "all_points_x": [point[0] for point in region["points"]],
            "all_points_y": [point[1] for point in region["points"]],
        }
    else:
        shape_attributes = {
            "name": "ellipse",
            "cx": region["cx"],
            "cy": region["cy"],
            "rx": region["rx"],
            "ry": region["ry"],
        }
    return {
        "shape_attributes": shape_attributes,
        "region_attributes": {"label": region["label"]},
    }


def via_export_filename(item: BatchItem, *, unique: bool) -> str:
    if not unique:
        return f"{safe_stem(item.relative_path)}_colored.png"
    relative = PurePosixPath(item.relative_path)
    flattened = "__".join(relative.with_suffix("").parts)
    flattened = re.sub(r'[<>:"/\\|?*\x00-\x1f]+', "_", flattened).strip(" ._")
    if not flattened:
        flattened = "dicom"
    return f"{flattened}_{item.content_hash[:8]}_colored.png"


def render_annotation_reference(
    item: BatchItem,
    image: DicomImage,
    annotations: dict[str, Any],
    *,
    unique_filename: bool,
) -> tuple[str, bytes, dict[str, Any]]:
    settings = canonical_settings(
        annotations.get("colorSettingsSnapshot") or saved_settings_for(item) or DEFAULT_SETTINGS
    )
    settings["format"] = "PNG"
    rgb = render_color_image(image, settings)
    encoded = encode_image(rgb, "PNG")
    filename = via_export_filename(item, unique=unique_filename)
    metadata = {
        "filename": filename,
        "size": len(encoded),
        "regions": [via_region(region) for region in annotations.get("regions", [])],
        "file_attributes": {
            "source_relative_path": item.relative_path,
            "content_hash": item.content_hash,
            "color_settings": json.dumps(
                settings, ensure_ascii=False, separators=(",", ":")
            ),
        },
    }
    return filename, encoded, metadata


def via_metadata_key(metadata: dict[str, Any]) -> str:
    return f"{metadata['filename']}{metadata['size']}"


def cleanup_expired_jobs() -> None:
    cutoff = time.time() - JOB_TTL_SECONDS
    with _state_lock:
        expired = [
            job_id
            for job_id, job in _jobs.items()
            if job.finished_at is not None and job.finished_at < cutoff
        ]
        for job_id in expired:
            job = _jobs.pop(job_id)
            if job.result_path is not None:
                job.result_path.unlink(missing_ok=True)


def remove_job_result(job: ExportJob) -> None:
    with _state_lock:
        if job.result_path is not None:
            job.result_path.unlink(missing_ok=True)
            job.result_path = None


def job_summary(job: ExportJob) -> dict[str, Any]:
    return {
        "jobId": job.job_id,
        "jobType": job.job_type,
        "format": job.format,
        "jpegQuality": job.jpeg_quality,
        "status": job.status,
        "processedFiles": job.processed_files,
        "totalFiles": job.total_files,
        "currentFile": job.current_file,
        "errorCount": job.error_count,
        "message": job.message,
        "error": job.error,
        "downloadReady": (
            job.status == "completed"
            and job.result_path is not None
            and job.result_path.exists()
        ),
    }


def run_export_job(job_id: str, entries: list[tuple[str, dict[str, Any]]]) -> None:
    job = _jobs[job_id]
    result_path = JOB_DIR / f"{job_id}.zip"
    errors: list[str] = []
    try:
        job.status = "running"
        job.message = "컬러 변환을 시작합니다."
        with ZipFile(result_path, mode="w", compression=ZIP_DEFLATED) as archive:
            for file_index, (item_id, settings) in enumerate(entries, start=1):
                if job.cancel_event.is_set():
                    job.status = "cancelled"
                    job.message = "사용자가 작업을 취소했습니다."
                    break
                item = get_item(item_id, job.user_id)
                job.current_file = item.relative_path
                try:
                    image = load_item_image(item)
                    base_path = archive_base_path(item)
                    extension = settings["format"].lower()
                    rgb = render_color_image(image, settings)
                    encoded = encode_image(
                        rgb,
                        settings["format"],
                        jpeg_quality=settings["jpegQuality"],
                    )
                    archive.writestr(f"{base_path.as_posix()}.{extension}", encoded)
                except Exception as exc:
                    errors.append(f"{item.relative_path}: {exc}")
                    job.error_count = len(errors)
                job.processed_files = file_index
                job.message = f"{file_index}/{job.total_files}개 파일 처리 완료"

            if errors and job.status != "cancelled":
                archive.writestr("_변환_오류.txt", "\n".join(errors).encode("utf-8"))

        if job.status == "cancelled":
            result_path.unlink(missing_ok=True)
            return
        job.status = "completed"
        job.result_path = result_path
        job.message = (
            f"{job.total_files}개 파일 변환 완료"
            if not errors
            else f"변환 완료 · 오류 {len(errors)}개"
        )
    except Exception as exc:
        result_path.unlink(missing_ok=True)
        job.status = "failed"
        job.error = str(exc)
        job.message = "일괄 변환에 실패했습니다."
    finally:
        job.finished_at = time.time()


def run_via_export_job(
    job_id: str, entries: list[tuple[str, dict[str, Any]]]
) -> None:
    job = _jobs[job_id]
    result_path = JOB_DIR / f"{job_id}.zip"
    errors: list[str] = []
    metadata_by_key: dict[str, Any] = {}
    manifest_entries: list[dict[str, Any]] = []
    used_filenames: set[str] = set()
    success_count = 0
    try:
        job.status = "running"
        job.message = "ROI VIA 패키지를 생성합니다."
        with ZipFile(result_path, mode="w", compression=ZIP_DEFLATED) as archive:
            for file_index, (item_id, annotations) in enumerate(entries, start=1):
                if job.cancel_event.is_set():
                    job.status = "cancelled"
                    job.message = "사용자가 작업을 취소했습니다."
                    break
                item = get_item(item_id, job.user_id)
                job.current_file = item.relative_path
                try:
                    image = load_item_image(item)
                    if (
                        annotations.get("rows") != image.rows
                        or annotations.get("columns") != image.columns
                    ):
                        raise ValueError("저장된 ROI의 영상 크기가 현재 DICOM과 일치하지 않습니다.")
                    filename, encoded, metadata = render_annotation_reference(
                        item, image, annotations, unique_filename=True
                    )
                    if filename.casefold() in used_filenames:
                        stem = Path(filename).stem
                        filename = f"{stem}_{item.item_id[:8]}.png"
                        metadata["filename"] = filename
                    used_filenames.add(filename.casefold())
                    archive.writestr(f"images/{filename}", encoded)
                    metadata_by_key[via_metadata_key(metadata)] = metadata
                    manifest_entries.append(
                        {
                            "imageFilename": filename,
                            "sourceRelativePath": item.relative_path,
                            "contentHash": item.content_hash,
                            "rows": image.rows,
                            "columns": image.columns,
                            "roiCount": len(annotations.get("regions", [])),
                            "colorSettingsSnapshot": annotations.get(
                                "colorSettingsSnapshot"
                            ),
                            "updatedAt": annotations.get("updatedAt"),
                        }
                    )
                    success_count += 1
                except Exception as exc:
                    errors.append(f"{item.relative_path}: {exc}")
                    job.error_count = len(errors)
                job.processed_files = file_index
                job.message = f"{file_index}/{job.total_files}개 ROI 파일 처리 완료"

            if job.status != "cancelled":
                if success_count == 0:
                    raise ValueError("VIA 패키지로 내보낼 수 있는 ROI 파일이 없습니다.")
                archive.writestr(
                    "_via_region_data.json",
                    json.dumps(
                        metadata_by_key, ensure_ascii=False, indent=2
                    ).encode("utf-8"),
                )
                archive.writestr(
                    "roi_manifest.json",
                    json.dumps(
                        {
                            "schemaVersion": 1,
                            "labels": configured_roi_labels(job.user_id),
                            "items": manifest_entries,
                        },
                        ensure_ascii=False,
                        indent=2,
                    ).encode("utf-8"),
                )
                if errors:
                    archive.writestr(
                        "_ROI_내보내기_오류.txt", "\n".join(errors).encode("utf-8")
                    )

        if job.status == "cancelled":
            result_path.unlink(missing_ok=True)
            return
        job.status = "completed"
        job.result_path = result_path
        job.message = (
            f"{success_count}개 ROI VIA 패키지 생성 완료"
            if not errors
            else f"ROI 패키지 생성 완료 · 오류 {len(errors)}개"
        )
    except Exception as exc:
        result_path.unlink(missing_ok=True)
        job.status = "failed"
        job.error = str(exc)
        job.message = "ROI VIA 패키지 생성에 실패했습니다."
    finally:
        job.finished_at = time.time()


@app.errorhandler(ValueError)
def handle_value_error(error: ValueError):
    return jsonify({"error": str(error)}), 400


@app.errorhandler(PermissionError)
def handle_permission_error(error: PermissionError):
    return jsonify({"error": str(error)}), 401


@app.errorhandler(413)
def handle_too_large(_error):
    return jsonify({"error": "파일이 너무 큽니다. 파일당 최대 크기는 512MB입니다."}), 413


@app.before_request
def require_api_login():
    if not request.path.startswith("/api/") or request.path.startswith("/api/auth/"):
        return None
    user_id = session.get("colorizer_user_id")
    if not user_id or store.user_by_id(str(user_id)) is None:
        session.clear()
        return jsonify({"error": "로그인이 필요합니다."}), 401
    return None


def _credentials() -> tuple[str, str]:
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    if not re.fullmatch(r"[\w.-]{3,40}", username, flags=re.UNICODE):
        raise ValueError("아이디는 문자, 숫자, ., _, -를 사용해 3~40자로 입력해 주세요.")
    if not 8 <= len(password) <= 128:
        raise ValueError("비밀번호는 8~128자로 입력해 주세요.")
    return username, password


def _user_response(user: dict[str, Any]) -> dict[str, Any]:
    return {"id": user["id"], "username": user["username"]}


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/auth/register")
def api_register():
    username, password = _credentials()
    user_id = uuid.uuid4().hex
    try:
        user = store.create_user(
            user_id,
            username,
            generate_password_hash(password),
            utc_timestamp(),
            ROI_LABELS,
        )
        migrate_legacy_json_for_first_user(user_id)
    except sqlite3.IntegrityError as exc:
        raise ValueError("이미 사용 중인 아이디입니다.") from exc
    session.clear()
    session["colorizer_user_id"] = user_id
    session.permanent = True
    return jsonify({"user": _user_response(user)}), 201


@app.post("/api/auth/login")
def api_login():
    username, password = _credentials()
    user = store.user_by_username(username)
    if user is None or not check_password_hash(str(user["password_hash"]), password):
        raise PermissionError("아이디 또는 비밀번호가 올바르지 않습니다.")
    session.clear()
    session["colorizer_user_id"] = user["id"]
    session.permanent = True
    return jsonify({"user": _user_response(user)})


@app.post("/api/auth/logout")
def api_logout():
    session.clear()
    return jsonify({"message": "로그아웃되었습니다."})


@app.get("/api/auth/me")
def api_me():
    user_id = session.get("colorizer_user_id")
    user = store.user_by_id(str(user_id)) if user_id else None
    if user is None:
        session.clear()
        raise PermissionError("로그인이 필요합니다.")
    return jsonify({"user": _user_response(user)})


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/batches")
def api_create_batch():
    user_id = current_user_id()
    payload = request.get_json(silent=True) or {}
    source_type = str(payload.get("sourceType", "upload"))
    label = str(payload.get("label", "DICOM 작업"))[:200]
    if source_type not in {"upload", "folder"}:
        raise ValueError("지원하지 않는 불러오기 방식입니다.")
    batch = create_batch(label, source_type, user_id)
    return jsonify(batch_summary(batch)), 201


@app.get("/api/batches")
def api_list_batches():
    user_id = current_user_id()
    batches = [
        {
            "batchId": record["id"],
            "label": record["label"],
            "sourceType": record["source_type"],
            "createdAt": datetime.fromtimestamp(
                float(record["created_at"]), timezone.utc
            ).isoformat(),
            "itemCount": int(record["item_count"]),
        }
        for record in store.list_batches(user_id)
    ]
    return jsonify({"batches": batches})


@app.post("/api/batches/<batch_id>/files")
def api_upload_batch_files(batch_id: str):
    user_id = current_user_id()
    batch = get_batch(batch_id, user_id)
    files = request.files.getlist("files")
    relative_paths = request.form.getlist("relativePaths")
    if not files:
        raise ValueError("업로드할 DICOM 파일이 없습니다.")
    if relative_paths and len(relative_paths) != len(files):
        raise ValueError("파일과 상대 경로 개수가 일치하지 않습니다.")

    batch_directory = (UPLOAD_DIR / user_id / batch.batch_id).resolve()
    batch_directory.relative_to(UPLOAD_DIR)
    batch_directory.mkdir(parents=True, exist_ok=True)
    accepted: list[dict[str, Any]] = []
    for index, uploaded in enumerate(files):
        destination: Path | None = None
        raw_name = uploaded.filename or f"dicom_{index + 1}.dcm"
        raw_relative = relative_paths[index] if relative_paths else raw_name
        try:
            relative_path = clean_relative_path(raw_relative, raw_name)
            destination = batch_directory / f"{uuid.uuid4().hex}{Path(raw_name).suffix.lower()}"
            content_hash = save_uploaded_file(uploaded, destination, user_id)
            item = add_batch_item(
                batch,
                destination,
                relative_path,
                content_hash=content_hash,
            )
            accepted.append(item_summary(item))
        except Exception as exc:
            if destination is not None:
                destination.unlink(missing_ok=True)
            accepted.append(
                {
                    "itemId": None,
                    "relativePath": str(raw_relative),
                    "contentHash": None,
                    "imageHash": None,
                    "error": str(exc),
                    "acquisition": default_acquisition_summary(),
                    "savedSettings": None,
                    "roiCount": 0,
                }
            )
    return jsonify({"items": accepted, "itemCount": len(batch.items)})


@app.post("/api/batches/<batch_id>/remove-items")
def api_remove_batch_items(batch_id: str):
    user_id = current_user_id()
    batch = get_batch(batch_id, user_id)
    payload = request.get_json(force=True)
    item_ids = payload.get("itemIds", [])
    if not isinstance(item_ids, list):
        raise ValueError("제외할 파일 목록이 올바르지 않습니다.")

    removed: list[BatchItem] = []
    with _state_lock:
        for item_id in dict.fromkeys(str(value) for value in item_ids):
            item = batch.items.get(item_id)
            if item is None:
                continue
            batch.items.pop(item_id, None)
            _items.pop(item_id, None)
            _image_cache.pop(item_id, None)
            removed.append(item)

    for item in removed:
        item.source_path.unlink(missing_ok=True)
    store.delete_items(batch.batch_id, user_id, [item.item_id for item in removed])
    return jsonify({"removedCount": len(removed), **batch_summary(batch)})


@app.get("/api/batches/<batch_id>")
def api_get_batch(batch_id: str):
    return jsonify(batch_summary(get_batch(batch_id, current_user_id())))


@app.post("/api/batches/<batch_id>/reset-item-names")
def api_reset_batch_item_names(batch_id: str):
    user_id = current_user_id()
    batch = get_batch(batch_id, user_id)
    reset_count = store.reset_item_relative_paths(batch_id, user_id)
    with _state_lock:
        for item in batch.items.values():
            item.relative_path = item.original_relative_path
    return jsonify({"resetCount": reset_count, **batch_summary(batch)})


@app.delete("/api/batches/<batch_id>")
def api_delete_batch(batch_id: str):
    user_id = current_user_id()
    batch = get_batch(batch_id, user_id)
    if not store.delete_batch(batch_id, user_id):
        raise ValueError("삭제할 작업을 찾을 수 없습니다.")
    with _state_lock:
        _batches.pop(batch_id, None)
        for item_id in list(batch.items):
            _items.pop(item_id, None)
            _image_cache.pop(item_id, None)
    batch_directory = (UPLOAD_DIR / user_id / batch_id).resolve()
    try:
        batch_directory.relative_to(UPLOAD_DIR)
    except ValueError as exc:
        raise ValueError("삭제할 작업 경로가 올바르지 않습니다.") from exc
    if batch_directory.exists():
        shutil.rmtree(batch_directory)
    return jsonify({"deleted": True, "batchId": batch_id})


@app.get("/api/items/<item_id>")
def api_get_item(item_id: str):
    item = get_item(item_id, current_user_id())
    image = load_item_image(item)
    return jsonify(source_information(item, image))


@app.patch("/api/items/<item_id>/name")
def api_rename_item(item_id: str):
    user_id = current_user_id()
    item = get_item(item_id, user_id)
    batch = get_batch(item.batch_id, user_id)
    payload = request.get_json(force=True)
    with _state_lock:
        relative_path = renamed_relative_path(batch, item, payload.get("name"))
        if relative_path != item.relative_path:
            if not store.update_item_relative_path(item.item_id, user_id, relative_path):
                raise ValueError("이름을 수정할 파일을 찾을 수 없습니다.")
            item.relative_path = relative_path
    return jsonify(item_summary(item))


@app.post("/api/items/<item_id>/render")
def api_render_item(item_id: str):
    payload = request.get_json(force=True)
    item = get_item(item_id, current_user_id())
    image = load_item_image(item)
    info = image_information(image)
    settings = canonical_settings(payload)
    pixels = image.frames[0]
    parameters = render_parameters(settings)
    grayscale = render_colormap(
        pixels,
        colormap="gray",
        invert=settings["invertGrayscale"],
        **parameters,
    )
    color = render_colormap(pixels, colormap=settings["colormap"], invert=False, **parameters)
    return jsonify(
        {
            "grayscale": image_data_url(grayscale),
            "color": image_data_url(color),
            "scale": image_data_url(make_colormap_scale(settings["colormap"])),
            **info,
        }
    )


@app.get("/api/roi-labels")
def api_get_roi_labels():
    return jsonify({"labels": configured_roi_labels(current_user_id())})


@app.post("/api/roi-labels")
def api_add_roi_label():
    user_id = current_user_id()
    payload = request.get_json(force=True)
    if not isinstance(payload, dict):
        raise ValueError("ROI 라벨 데이터 형식이 올바르지 않습니다.")
    label = canonical_roi_label(payload.get("name"))
    with _annotations_lock:
        labels = configured_roi_labels(user_id)
        if any(existing.casefold() == label.casefold() for existing in labels):
            raise ValueError("같은 이름의 ROI 라벨이 이미 있습니다.")
        if len(labels) >= MAX_ROI_LABELS:
            raise ValueError(f"ROI 라벨은 최대 {MAX_ROI_LABELS}개까지 만들 수 있습니다.")
        store.add_label(user_id, label)
        labels.append(label)
    return jsonify({"labels": labels, "added": label}), 201


@app.put("/api/roi-labels")
def api_rename_roi_label():
    user_id = current_user_id()
    payload = request.get_json(force=True)
    if not isinstance(payload, dict):
        raise ValueError("ROI 라벨 데이터 형식이 올바르지 않습니다.")
    old_name = canonical_roi_label(payload.get("oldName"))
    new_name = canonical_roi_label(payload.get("newName"))
    with _annotations_lock:
        labels = configured_roi_labels(user_id)
        if old_name not in labels:
            raise ValueError("이름을 변경할 ROI 라벨을 찾을 수 없습니다.")
        index = labels.index(old_name)
        if old_name == new_name:
            return jsonify(
                {
                    "labels": labels,
                    "oldName": old_name,
                    "newName": new_name,
                    "renamedRegionCount": 0,
                }
            )
        if any(
            label_index != index and existing.casefold() == new_name.casefold()
            for label_index, existing in enumerate(labels)
        ):
            raise ValueError("같은 이름의 ROI 라벨이 이미 있습니다.")
        renamed_regions = store.rename_label(user_id, old_name, new_name)
        labels[index] = new_name
    return jsonify(
        {
            "labels": labels,
            "oldName": old_name,
            "newName": new_name,
            "renamedRegionCount": renamed_regions,
        }
    )


@app.get("/api/items/<item_id>/annotations")
def api_get_item_annotations(item_id: str):
    item = get_item(item_id, current_user_id())
    image = load_item_image(item)
    return jsonify(annotation_summary(item, image))


@app.put("/api/items/<item_id>/annotations")
def api_save_item_annotations(item_id: str):
    user_id = current_user_id()
    item = get_item(item_id, user_id)
    image = load_item_image(item)
    payload = request.get_json(force=True)
    if not isinstance(payload, dict):
        raise ValueError("ROI 저장 데이터 형식이 올바르지 않습니다.")
    regions = canonical_regions(payload.get("regions"), image, user_id)
    settings = canonical_settings(
        payload.get("colorSettingsSnapshot") or DEFAULT_SETTINGS
    )
    updated_at = utc_timestamp()
    saved = {
        "regions": regions,
        "colorSettingsSnapshot": settings,
    }
    with _annotations_lock:
        if regions:
            store.save_annotations(
                user_id,
                item.content_hash,
                image.rows,
                image.columns,
                saved,
                updated_at,
            )
        else:
            store.delete_annotations(user_id, item.content_hash)
    result = annotation_summary(item, image)
    result["roiCount"] = len(result["regions"])
    return jsonify(result)


@app.get("/api/items/<item_id>/annotations/via")
def api_download_item_annotations_via(item_id: str):
    item = get_item(item_id, current_user_id())
    image = load_item_image(item)
    annotations = saved_annotations_for(item)
    if not annotations or not annotations.get("regions"):
        raise ValueError("먼저 현재 파일의 ROI를 저장해 주세요.")
    if (
        annotations.get("rows") != image.rows
        or annotations.get("columns") != image.columns
    ):
        raise ValueError("저장된 ROI의 영상 크기가 현재 DICOM과 일치하지 않습니다.")
    _filename, _encoded, metadata = render_annotation_reference(
        item, image, annotations, unique_filename=False
    )
    body = json.dumps(
        {via_metadata_key(metadata): metadata}, ensure_ascii=False, indent=2
    ).encode("utf-8")
    return send_file(
        BytesIO(body),
        mimetype="application/json",
        as_attachment=True,
        download_name=f"{safe_stem(item.relative_path)}_roi_via.json",
    )


@app.put("/api/items/<item_id>/settings")
def api_save_item_settings(item_id: str):
    item = get_item(item_id, current_user_id())
    image = load_item_image(item)
    settings = canonical_settings(request.get_json(force=True))
    with _settings_lock:
        store.save_settings(item.user_id, item.content_hash, settings, utc_timestamp())
    return jsonify({"contentHash": item.content_hash, "savedSettings": settings})


@app.post("/api/items/<item_id>/download")
def api_download_item(item_id: str):
    item = get_item(item_id, current_user_id())
    image = load_item_image(item)
    payload = request.get_json(force=True)
    settings = canonical_settings(payload)
    rgb = render_color_image(image, settings)
    encoded = encode_image(rgb, settings["format"], jpeg_quality=settings["jpegQuality"])
    return send_file(
        BytesIO(encoded),
        mimetype="image/png" if settings["format"] == "PNG" else "image/jpeg",
        as_attachment=True,
        download_name=item_download_name(item, settings),
    )


@app.post("/api/export-jobs")
def api_create_export_job():
    cleanup_expired_jobs()
    user_id = current_user_id()
    payload = request.get_json(force=True)
    batch = get_batch(str(payload.get("batchId", "")), user_id)
    job_type = str(payload.get("jobType", "images")).lower()
    if job_type not in {"images", "via"}:
        raise ValueError("지원하지 않는 일괄 작업 형식입니다.")

    if job_type == "via":
        annotation_entries: list[tuple[str, dict[str, Any]]] = []
        for item in batch.items.values():
            if item.error:
                continue
            annotations = saved_annotations_for(item)
            if annotations and annotations.get("regions"):
                annotation_entries.append((item.item_id, annotations))
        if not annotation_entries:
            raise ValueError("저장된 ROI가 있는 파일이 없습니다.")
        job = ExportJob(
            job_id=uuid.uuid4().hex,
            batch_id=batch.batch_id,
            user_id=user_id,
            job_type="via",
            format="VIA",
            total_files=len(annotation_entries),
            message="ROI VIA 패키지 작업 대기 중",
        )
        with _state_lock:
            _jobs[job.job_id] = job
        _job_executor.submit(run_via_export_job, job.job_id, annotation_entries)
        return jsonify(job_summary(job)), 202

    scope = str(payload.get("scope", "saved"))
    if scope not in {"saved", "all"}:
        raise ValueError("일괄 다운로드 범위가 올바르지 않습니다.")
    fallback = canonical_settings(payload.get("fallbackSettings") or DEFAULT_SETTINGS)
    output_settings = canonical_settings(
        {
            **fallback,
            "format": payload.get("format", fallback["format"]),
            "jpegQuality": payload.get("jpegQuality", fallback["jpegQuality"]),
        }
    )
    output_format = output_settings["format"]
    jpeg_quality = output_settings["jpegQuality"]

    entries: list[tuple[str, dict[str, Any]]] = []
    for item in batch.items.values():
        if item.error:
            continue
        saved = saved_settings_for(item)
        if saved is not None:
            settings = canonical_settings(saved)
        elif scope == "all":
            settings = dict(fallback)
        else:
            continue
        settings["format"] = output_format
        settings["jpegQuality"] = jpeg_quality
        entries.append((item.item_id, settings))
    if not entries:
        raise ValueError("변환할 파일이 없습니다. 설정 저장 범위나 파일 오류를 확인하세요.")

    job = ExportJob(
        job_id=uuid.uuid4().hex,
        batch_id=batch.batch_id,
        user_id=user_id,
        job_type="images",
        format=output_format,
        jpeg_quality=jpeg_quality,
        total_files=len(entries),
    )
    with _state_lock:
        _jobs[job.job_id] = job
    _job_executor.submit(run_export_job, job.job_id, entries)
    return jsonify(job_summary(job)), 202


@app.get("/api/export-jobs/<job_id>")
def api_get_export_job(job_id: str):
    cleanup_expired_jobs()
    with _state_lock:
        job = _jobs.get(job_id)
    if job is None or job.user_id != current_user_id():
        raise ValueError("변환 작업을 찾을 수 없거나 결과가 만료되었습니다.")
    return jsonify(job_summary(job))


@app.delete("/api/export-jobs/<job_id>")
def api_cancel_export_job(job_id: str):
    with _state_lock:
        job = _jobs.get(job_id)
    if job is None or job.user_id != current_user_id():
        raise ValueError("변환 작업을 찾을 수 없습니다.")
    if job.status in {"queued", "running"}:
        job.cancel_event.set()
        job.message = "취소 요청을 처리하고 있습니다."
    return jsonify(job_summary(job))


@app.get("/api/export-jobs/<job_id>/download")
def api_download_export_job(job_id: str):
    with _state_lock:
        job = _jobs.get(job_id)
    if (
        job is None
        or job.user_id != current_user_id()
        or job.status != "completed"
        or job.result_path is None
        or not job.result_path.exists()
    ):
        raise ValueError("다운로드할 변환 결과가 준비되지 않았습니다.")
    batch = get_batch(job.batch_id, job.user_id)
    download_name = (
        f"{batch.label or 'dicom'}_roi_via.zip"
        if job.job_type == "via"
        else f"{batch.label or 'dicom'}_converted_{job.format.lower()}.zip"
    )
    response = send_file(
        job.result_path,
        mimetype="application/zip",
        as_attachment=True,
        download_name=download_name,
    )
    response.call_on_close(lambda: remove_job_result(job))
    return response


def open_browser() -> None:
    webbrowser.open_new("http://127.0.0.1:8501")


if __name__ == "__main__":
    threading.Timer(1.0, open_browser).start()
    app.run(host="127.0.0.1", port=8501, threaded=True)
