"""Person re-identification embedding extractor using OSNet."""

import logging

import cv2
import numpy as np
import torch
from PIL import Image
from torchvision import transforms

logger = logging.getLogger(__name__)

INPUT_SIZE = (256, 128)  # height x width, what OSNet was trained on
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


class ReIdEmbedder:
    """Extracts 512-dim appearance embeddings from person crops via OSNet."""

    def __init__(self, model_name: str = "osnet_x1_0"):
        import torchreid

        logger.info("Loading re-ID model: %s", model_name)
        self.model = torchreid.models.build_model(
            name=model_name,
            num_classes=1000,
            pretrained=True,
        )
        self.model.eval()
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self._device)

        self._transform = transforms.Compose([
            transforms.Resize(INPUT_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])
        logger.info("Re-ID model loaded (device=%s)", self._device)

    def extract(self, crop_bgr: np.ndarray) -> np.ndarray:
        """Return an L2-normalised 512-dim embedding from a BGR person crop."""
        rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)
        tensor = self._transform(pil_img).unsqueeze(0).to(self._device)

        with torch.no_grad():
            features = self.model(tensor)

        vec = features.squeeze().cpu().numpy().astype(np.float64)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Cosine similarity between two L2-normalised vectors (i.e. dot product)."""
        return float(np.dot(a, b))
