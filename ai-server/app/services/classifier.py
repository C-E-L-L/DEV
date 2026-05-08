import cv2
import torch
from PIL import Image
from torchvision import transforms
from dataclasses import dataclass
from app.config import CLASS_NAMES, INPUT_SIZE, IMAGENET_MEAN, IMAGENET_STD
from app.services.model_loader import ModelLoader


@dataclass
class ClassificationResult:
    """DenseNet 분류 결과"""
    predicted_class: str
    confidence: float


class ClassifierService:
    """DenseNet-201로 크롭된 세포 이미지를 분류하는 서비스"""

    _transform = transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])

    @staticmethod
    def classify(crop_path: str) -> ClassificationResult:
        input_tensor = ClassifierService._preprocess(crop_path)
        predicted_idx, confidence = ClassifierService._infer(input_tensor)

        return ClassificationResult(
            predicted_class=CLASS_NAMES[predicted_idx],
            confidence=round(confidence, 4),
        )

    @staticmethod
    def _preprocess(image_path: str) -> torch.Tensor:
        image = cv2.imread(image_path)
        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        tensor = ClassifierService._transform(pil_image)
        return tensor.unsqueeze(0).to(ModelLoader.device)

    @staticmethod
    def _infer(input_tensor: torch.Tensor) -> tuple[int, float]:
        with torch.no_grad():
            outputs = ModelLoader.densenet_model(input_tensor)
            probs = torch.nn.functional.softmax(outputs[0], dim=0)
            max_prob, predicted_idx = torch.max(probs, 0)
        return predicted_idx.item(), max_prob.item()
