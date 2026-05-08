from app.models import DetectedCell, AnalysisResponse
from app.services.detector import DetectorService
from app.services.classifier import ClassifierService


class PipelineService:
    """탐지(YOLO) → 분류(DenseNet) 전체 파이프라인을 조율하는 서비스"""

    @staticmethod
    def run(image_path: str) -> AnalysisResponse:
        cropped_cells = DetectorService.detect_and_crop(image_path)
        detected = [
            PipelineService._process_single(cell)
            for cell in cropped_cells
        ]
        return AnalysisResponse.from_cells(detected)

    @staticmethod
    def _process_single(cell) -> DetectedCell:
        result = ClassifierService.classify(cell.crop_path)
        return DetectedCell(
            crop_filename=cell.crop_filename,
            bbox=str(cell.bbox),
            prediction=result.predicted_class,
            confidence=result.confidence,
        )
