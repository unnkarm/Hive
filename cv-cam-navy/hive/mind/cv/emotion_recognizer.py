"""Emotion Recognition based on Facial Landmarks and aligned crops."""
import logging
import numpy as np
import cv2

logger = logging.getLogger(__name__)

class EmotionRecognizer:
    def __init__(self, model_path: str = None):
        self.model_path = model_path
        self.session = None
        
        # Action labels
        self.LAUGHING = "laughing"
        self.SMILING = "smiling"
        self.CRYING = "crying"
        self.NEUTRAL = "neutral"
        
        # Heuristic thresholds
        self.SMILE_THRESHOLD = 0.82
        self.LAUGH_THRESHOLD = 0.95

        if self.model_path:
            try:
                import onnxruntime as ort
                self.session = ort.InferenceSession(self.model_path)
                logger.info("Emotion model loaded: %s", self.model_path)
            except Exception as e:
                logger.error("Failed to load emotion model: %s", e)

    def recognize(self, kps: np.ndarray, aligned_face: np.ndarray = None) -> str:
        """Determines emotion from landmarks or aligned face crop."""
        
        # 1. First try model if available
        if self.session and aligned_face is not None:
            return self._infer_from_model(aligned_face)
            
        # 2. Fallback to landmarks heuristic
        return self._infer_from_landmarks(kps)

    def get_mouth_width(self, kps: np.ndarray) -> float:
        """Returns the normalized mouth width."""
        if kps is None or len(kps) < 5:
            return 0.0
        left_eye = kps[0]
        right_eye = kps[1]
        left_mouth = kps[3]
        right_mouth = kps[4]
        
        eye_dist = np.linalg.norm(left_eye - right_eye)
        if eye_dist == 0: return 0.0
        return float(np.linalg.norm(left_mouth - right_mouth) / eye_dist)

    def _infer_from_landmarks(self, kps: np.ndarray) -> str:
        """
        kps: array of 5 landmarks [[x,y], ...]
        0: left_eye, 1: right_eye, 2: nose, 3: left_mouth, 4: right_mouth
        """
        if kps is None or len(kps) < 5:
            return self.NEUTRAL

        left_eye = kps[0]
        right_eye = kps[1]
        left_mouth = kps[3]
        right_mouth = kps[4]
        
        eye_dist = np.linalg.norm(left_eye - right_eye)
        mouth_width = np.linalg.norm(left_mouth - right_mouth)
        
        if eye_dist == 0:
            return self.NEUTRAL
            
        smile_ratio = mouth_width / eye_dist
        
        if smile_ratio > self.LAUGH_THRESHOLD:
            return self.LAUGHING
        elif smile_ratio > self.SMILE_THRESHOLD:
            return self.SMILING
            
        # Crying is extremely hard with 5 points, we default to neutral or 
        # look for specific mouth corner downturn if possible, but SCRFD is 
        # not precise enough for downturn detection usually.
        
        return self.NEUTRAL

    def _infer_from_model(self, aligned_face: np.ndarray) -> str:
        """Stub for ONNX model inference."""
        # This would involve preprocessing and running the ONNX session
        # For now, it's a placeholder.
        return self.NEUTRAL
