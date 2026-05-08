import cv2
import uuid
import os
from dataclasses import dataclass
from app.config import CROPS_DIR
from app.services.model_loader import ModelLoader


@dataclass
class CroppedCell:
    """YOLO가 탐지하고 크롭한 개별 세포 정보"""
    crop_filename: str
    crop_path: str
    bbox: list[int]  # [x1, y1, x2, y2]


class DetectorService:
    """YOLOv8로 원본 이미지에서 백혈구를 탐지하고 크롭하는 서비스"""

    @staticmethod
    def detect_and_crop(image_path: str) -> list[CroppedCell]:
        image = cv2.imread(image_path)
        results = ModelLoader.yolo_model(image_path)
        boxes = results[0].boxes

        return [
            DetectorService._crop_single(image, box)
            for box in boxes
        ]

    @staticmethod
    def _crop_single(image, box) -> CroppedCell:
        bbox = DetectorService._extract_bbox(box)
        cropped = DetectorService._crop_image(image, bbox)
        filename = DetectorService._save_crop(cropped)

        return CroppedCell(
            crop_filename=filename,
            crop_path=os.path.join(CROPS_DIR, filename),
            bbox=bbox,
        )

    @staticmethod
    def _extract_bbox(box) -> list[int]:
        return list(map(int, box.xyxy[0]))

    @staticmethod
    def _crop_image(image, bbox: list[int]):
        x1, y1, x2, y2 = bbox
        return image[y1:y2, x1:x2]

    @staticmethod
    def _save_crop(cropped_image) -> str:
        filename = f"crop_{uuid.uuid4().hex}.jpg"
        cv2.imwrite(os.path.join(CROPS_DIR, filename), cropped_image)
        return filename
