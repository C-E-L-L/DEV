import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models import AnalysisResponse
from app.config import ORIGINALS_DIR
from app.services.pipeline import PipelineService
from app.services.model_loader import ModelLoader

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """원본 이미지를 받아 YOLO 탐지 + DenseNet 분류 결과를 반환"""
    _check_models_ready()
    image_path = await _save_uploaded_file(file)
    return PipelineService.run(image_path)


def _check_models_ready():
    if not ModelLoader.is_ready():
        raise HTTPException(status_code=503, detail="AI 모델이 아직 로딩 중입니다.")


async def _save_uploaded_file(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"orig_{uuid.uuid4().hex}{ext}"
    path = os.path.join(ORIGINALS_DIR, filename)

    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)

    return path
