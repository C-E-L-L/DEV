from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image


CLASS_ID_TO_LABEL = {
    5: "Band",
    6: "Segment",
    8: "Lymphocyte",
    9: "Monocyte",
    10: "Eosinophil",
    12: "NucleatedRBC",
}

EXCLUDED_CLASS_IDS = {0, 1, 2, 3, 4, 7, 11}


@dataclass
class CellRecord:
    cell_id: str
    label: str
    class_id: int
    source_image: str
    source_label: str
    crop_filename: str
    bbox_xyxy: list[int]

    def to_dict(self) -> dict:
        return {
            "cellId": self.cell_id,
            "label": self.label,
            "classId": self.class_id,
            "sourceImage": self.source_image,
            "sourceLabelFile": self.source_label,
            "cropFilename": self.crop_filename,
            "bbox": self.bbox_xyxy,
        }


def yolo_to_xyxy(xc: float, yc: float, w: float, h: float, img_w: int, img_h: int) -> list[int]:
    x1 = int((xc - w / 2) * img_w)
    y1 = int((yc - h / 2) * img_h)
    x2 = int((xc + w / 2) * img_w)
    y2 = int((yc + h / 2) * img_h)
    x1 = max(0, min(x1, img_w - 1))
    y1 = max(0, min(y1, img_h - 1))
    x2 = max(1, min(x2, img_w))
    y2 = max(1, min(y2, img_h))
    return [x1, y1, x2, y2]


def iter_label_lines(path: Path) -> Iterable[tuple[int, float, float, float, float]]:
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) != 5:
            continue
        yield int(float(parts[0])), float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4])


def prepare_dataset(
    root: Path = Path(r"C:\CELL2\CELL\data\diagnostic_gt"),
) -> dict:
    raw_images = root / "raw" / "images"
    raw_labels = root / "raw" / "labels"
    processed_crops = root / "processed" / "crops"
    processed_manifest = root / "processed" / "manifest.json"
    processed_stats = root / "processed" / "stats.json"

    processed_crops.mkdir(parents=True, exist_ok=True)

    records: list[CellRecord] = []
    stats = {
        "imagesTotal": 0,
        "labelsTotal": 0,
        "cellsTotal": 0,
        "cellsByLabel": {},
        "excludedByClassId": {},
        "unknownClassId": {},
        "missingLabelFiles": [],
        "missingImageFiles": [],
    }

    image_paths = sorted(raw_images.glob("*.jpg"))
    label_paths = sorted(raw_labels.glob("*.txt"))
    stats["imagesTotal"] = len(image_paths)
    stats["labelsTotal"] = len(label_paths)

    image_stems = {p.stem for p in image_paths}
    label_stems = {p.stem for p in label_paths}
    stats["missingLabelFiles"] = sorted(f"{stem}.jpg" for stem in image_stems - label_stems)
    stats["missingImageFiles"] = sorted(f"{stem}.txt" for stem in label_stems - image_stems)

    for image_path in image_paths:
        label_path = raw_labels / f"{image_path.stem}.txt"
        if not label_path.exists():
            continue

        with Image.open(image_path) as img:
            rgb_img = img.convert("RGB")
            img_w, img_h = rgb_img.size

            for idx, (class_id, xc, yc, w, h) in enumerate(iter_label_lines(label_path), start=1):
                if class_id in EXCLUDED_CLASS_IDS:
                    stats["excludedByClassId"][str(class_id)] = stats["excludedByClassId"].get(str(class_id), 0) + 1
                    continue

                mapped = CLASS_ID_TO_LABEL.get(class_id)
                if mapped is None:
                    stats["unknownClassId"][str(class_id)] = stats["unknownClassId"].get(str(class_id), 0) + 1
                    continue

                x1, y1, x2, y2 = yolo_to_xyxy(xc, yc, w, h, img_w, img_h)
                if x2 <= x1 or y2 <= y1:
                    continue

                crop = rgb_img.crop((x1, y1, x2, y2))
                crop_filename = f"{image_path.stem}_cell_{idx:03d}.jpg"
                crop_path = processed_crops / crop_filename
                crop.save(crop_path, format="JPEG", quality=95)

                cell_id = f"{image_path.stem}:{idx}"
                record = CellRecord(
                    cell_id=cell_id,
                    label=mapped,
                    class_id=class_id,
                    source_image=image_path.name,
                    source_label=label_path.name,
                    crop_filename=crop_filename,
                    bbox_xyxy=[x1, y1, x2, y2],
                )
                records.append(record)
                stats["cellsByLabel"][mapped] = stats["cellsByLabel"].get(mapped, 0) + 1

    stats["cellsTotal"] = len(records)
    manifest = [r.to_dict() for r in records]
    processed_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    processed_stats.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    return stats


if __name__ == "__main__":
    result = prepare_dataset()
    print(json.dumps(result, ensure_ascii=False, indent=2))
