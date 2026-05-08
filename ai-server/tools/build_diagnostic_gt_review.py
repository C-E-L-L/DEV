from __future__ import annotations

import json
import shutil
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageOps, ImageDraw


ROOT = Path(r"C:\CELL2\CELL\data\diagnostic_gt\processed")
MANIFEST_PATH = ROOT / "manifest.json"
CROPS_DIR = ROOT / "crops"
REVIEW_DIR = ROOT / "review"
BY_CLASS_DIR = REVIEW_DIR / "by_class"
SHEETS_DIR = REVIEW_DIR / "contact_sheets"

THUMB_SIZE = (140, 140)
GRID_COLS = 10
GRID_ROWS = 10
SHEET_PER_PAGE = GRID_COLS * GRID_ROWS
PADDING = 8
HEADER_H = 40


def load_manifest() -> list[dict]:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def copy_by_class(records: list[dict]) -> dict[str, list[dict]]:
    grouped = defaultdict(list)
    for rec in records:
        grouped[rec["label"]].append(rec)

    for label, items in grouped.items():
        label_dir = BY_CLASS_DIR / label
        label_dir.mkdir(parents=True, exist_ok=True)
        for rec in items:
            src = CROPS_DIR / rec["cropFilename"]
            dst = label_dir / rec["cropFilename"]
            if src.exists():
                shutil.copy2(src, dst)
    return grouped


def draw_contact_sheet(label: str, items: list[dict]) -> list[str]:
    saved = []
    page_count = (len(items) + SHEET_PER_PAGE - 1) // SHEET_PER_PAGE
    sheet_w = PADDING + GRID_COLS * (THUMB_SIZE[0] + PADDING)
    sheet_h = HEADER_H + PADDING + GRID_ROWS * (THUMB_SIZE[1] + PADDING)

    for page in range(page_count):
        start = page * SHEET_PER_PAGE
        chunk = items[start:start + SHEET_PER_PAGE]
        canvas = Image.new("RGB", (sheet_w, sheet_h), color=(245, 245, 245))
        draw = ImageDraw.Draw(canvas)
        draw.text((PADDING, 10), f"{label} ({len(items)} cells) - page {page + 1}/{page_count}", fill=(20, 20, 20))

        for idx, rec in enumerate(chunk):
            r = idx // GRID_COLS
            c = idx % GRID_COLS
            x = PADDING + c * (THUMB_SIZE[0] + PADDING)
            y = HEADER_H + PADDING + r * (THUMB_SIZE[1] + PADDING)
            src = CROPS_DIR / rec["cropFilename"]
            if not src.exists():
                continue
            with Image.open(src) as im:
                thumb = ImageOps.contain(im.convert("RGB"), THUMB_SIZE)
                box = Image.new("RGB", THUMB_SIZE, color=(230, 230, 230))
                px = (THUMB_SIZE[0] - thumb.width) // 2
                py = (THUMB_SIZE[1] - thumb.height) // 2
                box.paste(thumb, (px, py))
            canvas.paste(box, (x, y))

        out = SHEETS_DIR / f"{label}_page_{page + 1:02d}.jpg"
        canvas.save(out, format="JPEG", quality=92)
        saved.append(out.name)
    return saved


def main() -> None:
    records = load_manifest()
    reset_dir(REVIEW_DIR)
    BY_CLASS_DIR.mkdir(parents=True, exist_ok=True)
    SHEETS_DIR.mkdir(parents=True, exist_ok=True)

    grouped = copy_by_class(records)
    summary = {}
    for label in sorted(grouped.keys()):
        items = grouped[label]
        pages = draw_contact_sheet(label, items)
        summary[label] = {
            "count": len(items),
            "sheetFiles": pages,
            "classDir": str((BY_CLASS_DIR / label).resolve()),
        }

    out = REVIEW_DIR / "summary.json"
    out.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
