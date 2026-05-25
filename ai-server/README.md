# Juhun's branch

# C.E.L.L. AI Server

YOLO + DenseNet 추론 전용 서버. Spring Boot 백엔드가 이 서버를 호출합니다.

## 실행 방법

```bash
cd ai-server

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행 (포트 8001)
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## 모델 가중치 배치

서버 실행 전에 `weights/` 폴더에 아래 파일을 넣어주세요:

```
ai-server/
└── weights/
    ├── yolov8_best.pt        # YOLOv8 탐지 모델
    └── densenet201_best.pth  # DenseNet-201 분류 모델
```

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/analyze | 이미지 업로드 → 탐지 + 분류 결과 반환 |
| GET | /health | 서버 상태 및 모델 로딩 확인 |

### POST /api/analyze

**Request:** `multipart/form-data` (field: `file`)

**Response:**
```json
{
  "total_detected": 3,
  "cells": [
    {
      "crop_filename": "crop_abc123.jpg",
      "bbox": "[100, 200, 300, 400]",
      "prediction": "SEG",
      "confidence": 0.9512
    }
  ]
}
```

## 디렉토리 구조

```
ai-server/
├── main.py                      # FastAPI 앱 진입점
├── requirements.txt
├── app/
│   ├── config.py                # 경로, 상수 설정
│   ├── models/
│   │   └── __init__.py          # Pydantic 응답 모델
│   ├── routers/
│   │   └── analyze_router.py    # /api/analyze 엔드포인트
│   └── services/
│       ├── model_loader.py      # YOLO + DenseNet 로딩 (싱글턴)
│       ├── detector.py          # YOLO 탐지 + 크롭
│       ├── classifier.py        # DenseNet 분류
│       └── pipeline.py          # 탐지 → 분류 오케스트레이션
├── weights/                     # 모델 가중치 (.pt, .pth)
└── data/
    ├── originals/               # 업로드된 원본 이미지
    └── crops/                   # 크롭된 세포 이미지
```
