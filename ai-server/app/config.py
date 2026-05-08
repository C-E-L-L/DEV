import os

# 기본 경로
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 모델 가중치 경로
WEIGHTS_DIR = os.path.join(BASE_DIR, "weights")
YOLO_WEIGHTS = os.path.join(WEIGHTS_DIR, "yolov8_best.pt")
DENSENET_WEIGHTS = os.path.join(WEIGHTS_DIR, "densenet201_best.pth")

# 이미지 저장 경로
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
ORIGINALS_DIR = os.path.join(DATA_DIR, "originals")
CROPS_DIR = os.path.join(DATA_DIR, "crops")

# 분류 클래스 (순서 중요 - 학습 시 사용한 순서와 동일해야 함)
CLASS_NAMES = ["Band", "Segment", "Lymphocyte", "Monocyte", "Eosinophil", "NucleatedRBC"]

# DenseNet 입력 이미지 크기
INPUT_SIZE = 256

# ImageNet 정규화 값
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# 디렉토리 자동 생성
for directory in [WEIGHTS_DIR, ORIGINALS_DIR, CROPS_DIR]:
    os.makedirs(directory, exist_ok=True)
