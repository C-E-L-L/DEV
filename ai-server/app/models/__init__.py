from pydantic import BaseModel


class DetectedCell(BaseModel):
    crop_filename: str
    bbox: str
    prediction: str
    confidence: float


class AnalysisResponse(BaseModel):
    total_detected: int
    cells: list[DetectedCell]

    @staticmethod
    def from_cells(cells: list[DetectedCell]) -> "AnalysisResponse":
        return AnalysisResponse(
            total_detected=len(cells),
            cells=cells,
        )
