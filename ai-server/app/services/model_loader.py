import torch
from ultralytics import YOLO
from torchvision import models as torch_models
from app.config import YOLO_WEIGHTS, DENSENET_WEIGHTS, CLASS_NAMES


class ModelLoader:
    """서버 시작 시 한 번만 모델을 로드하고, 전역에서 접근 가능하게 하는 싱글턴"""

    yolo_model = None
    densenet_model = None
    device = None
    _ready = False

    @classmethod
    def load_all(cls):
        cls.device = cls._resolve_device()
        cls.yolo_model = cls._load_yolo()
        cls.densenet_model = cls._load_densenet()
        cls._ready = True
        print(f"✅ All models loaded on {cls.device}")

    @classmethod
    def is_ready(cls) -> bool:
        return cls._ready

    @classmethod
    def _resolve_device(cls):
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")

    @classmethod
    def _load_yolo(cls) -> YOLO:
        print("Loading YOLOv8...")
        return YOLO(YOLO_WEIGHTS)

    @classmethod
    def _load_densenet(cls):
        print("Loading DenseNet-201...")
        model = torch_models.densenet201()
        model.classifier = torch.nn.Linear(
            model.classifier.in_features, len(CLASS_NAMES)
        )
        model.load_state_dict(
            torch.load(DENSENET_WEIGHTS, map_location=cls.device)
        )
        model.to(cls.device)
        model.eval()
        return model
