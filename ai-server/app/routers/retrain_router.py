import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import CROPS_DIR

router = APIRouter()

# Spring Boot 백엔드 주소
BACKEND_URL = "http://localhost:8080"


class RetrainRequest(BaseModel):
    """재학습 요청 파라미터"""
    epochs: int = 10
    batch_size: int = 16
    learning_rate: float = 0.001


class RetrainResponse(BaseModel):
    total_samples: int
    label_distribution: dict[str, int]
    status: str


@router.post("/retrain", response_model=RetrainResponse)
async def retrain_model(request: RetrainRequest):
    """
    재학습 파이프라인:
    1. Spring Boot에서 확정된 라벨 목록을 가져옴
    2. 해당 crop 이미지 + 라벨로 데이터셋 구성
    3. DenseNet-201 재학습 실행
    """
    training_data = await _fetch_training_data()
    _validate_training_data(training_data)
    label_dist = _count_labels(training_data)
    # TODO: 실제 재학습 로직 (services/trainer.py로 분리 예정)
    # trainer = TrainerService(training_data, request)
    # trainer.run()

    return RetrainResponse(
        total_samples=len(training_data),
        label_distribution=label_dist,
        status="READY",  # 실제 학습 구현 후 "COMPLETED"로 변경
    )


async def _fetch_training_data() -> list[dict]:
    """Spring Boot 백엔드에서 확정된 학습 데이터 목록 조회"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BACKEND_URL}/api/training-data")
        response.raise_for_status()
        return response.json()


def _validate_training_data(data: list[dict]):
    """학습 데이터가 충분한지 검증"""
    if len(data) < 10:
        raise HTTPException(
            status_code=400,
            detail=f"학습 데이터가 부족합니다. (현재 {len(data)}건, 최소 10건 필요)"
        )

    missing = [d for d in data if not _crop_file_exists(d["cropFilename"])]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"크롭 이미지 {len(missing)}건을 찾을 수 없습니다."
        )


def _crop_file_exists(filename: str) -> bool:
    return os.path.exists(os.path.join(CROPS_DIR, filename))


def _count_labels(data: list[dict]) -> dict[str, int]:
    counts = {}
    for item in data:
        label = item["label"]
        counts[label] = counts.get(label, 0) + 1
    return counts
