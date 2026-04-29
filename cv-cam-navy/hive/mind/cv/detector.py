"""YOLO-based person detection wrapper."""

import logging
import os

import cv2
import numpy as np
from ultralytics import YOLO

logger = logging.getLogger(__name__)

Detection = tuple[int, int, int, int, float, int] # (x1, y1, x2, y2, conf, cls)
IdentifiedDetection = tuple[int, int, int, int, float, str | None, str | None] # (x1, y1, x2, y2, conf, name, action)

# --- Constants ---
PERSON_CLASS_ID = 0
MIN_DETECTION_CONF = 0.45  # Increased to avoid false positives in vacant spaces
MIN_SIZE_PX = 40          # Ignore tiny blobs that might look like a person
BOX_THICKNESS = 2
LABEL_FONT = cv2.FONT_HERSHEY_SIMPLEX
LABEL_SCALE = 0.6
LABEL_THICKNESS = 2
LABEL_TEXT_COLOR = (255, 255, 255)
UNKNOWN_BOX_COLOR = (0, 0, 255)      # Red
UNKNOWN_BG_COLOR = (0, 0, 255)
IDENTIFIED_BOX_COLOR = (0, 255, 0)   # Green
IDENTIFIED_BG_COLOR = (0, 255, 0)

# COCO class mapping for context objects
CLASS_NAMES = {
    0: "person",
    63: "laptop",
    66: "keyboard",
    41: "cup",
    39: "bottle",
    45: "bowl",
    56: "chair",
    60: "dining table",
    67: "cell phone"
}


class PersonDetector:
    """Detects people in frames using YOLOv8."""

    def __init__(self, model_size: str | None = None):
        model_size = model_size or os.getenv("YOLO_MODEL", "yolov8n")
        if not model_size.endswith(".pt"):
            model_size = f"{model_size}.pt"
        logger.info("Loading YOLO model: %s", model_size)
        self.model = YOLO(model_size)
        logger.info("YOLO model loaded")

    def detect(self, frame: np.ndarray, classes: list[int] | None = None) -> list[Detection]:
        """Run detection and return bounding boxes. Defaults to person-only."""
        target_classes = classes if classes is not None else [PERSON_CLASS_ID]
        results = self.model(frame, classes=target_classes, verbose=False, conf=MIN_DETECTION_CONF)
        detections: list[Detection] = []
        for box in results[0].boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            
            # Filter out tiny detections that are likely noise/vacant spaces
            w, h = x2 - x1, y2 - y1
            if w < MIN_SIZE_PX or h < MIN_SIZE_PX:
                continue
                
            detections.append((x1, y1, x2, y2, conf, cls))
        return detections

    @staticmethod
    def annotate(
        frame: np.ndarray,
        detections: list[Detection] | list[IdentifiedDetection],
    ) -> np.ndarray:
        """Draw detections onto a frame. Returns a new image.

        Accepts either plain 6-tuples (YOLO raw) or 7-tuples with an
        optional person name and action for re-ID labelling.
        """
        annotated = frame.copy()
        for det in detections:
            x1, y1, x2, y2, conf = det[0], det[1], det[2], det[3], det[4]
            
            if len(det) == 7:
                name: str | None = det[5] # type: ignore
                action: str | None = det[6] # type: ignore
                cls = 0
            else:
                name = None
                action = None
                cls = int(det[5]) # type: ignore

            if name is not None:
                # Identified person: show name and action if any, then confidence
                if action and action != "unknown":
                    label = f"{name} ({action}) {conf:.2f}"
                else:
                    label = f"{name} {conf:.2f}"
                box_color = IDENTIFIED_BOX_COLOR
                bg_color = IDENTIFIED_BG_COLOR
            else:
                # Unidentified person or object: show class name and confidence
                class_name = CLASS_NAMES.get(cls, f"obj_{cls}")
                if action and action != "...":
                    label = f"{class_name} ({action}) {conf:.2f}"
                else:
                    label = f"{class_name} {conf:.2f}"
                box_color = UNKNOWN_BOX_COLOR
                bg_color = UNKNOWN_BG_COLOR

            cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, BOX_THICKNESS)

            (tw, th), baseline = cv2.getTextSize(label, LABEL_FONT, LABEL_SCALE, LABEL_THICKNESS)
            label_y = max(y1 - 6, th + 4)
            cv2.rectangle(
                annotated,
                (x1, label_y - th - 4),
                (x1 + tw + 4, label_y + baseline),
                bg_color,
                cv2.FILLED,
            )
            cv2.putText(
                annotated, label, (x1 + 2, label_y - 2),
                LABEL_FONT, LABEL_SCALE, LABEL_TEXT_COLOR, LABEL_THICKNESS,
            )
        return annotated

    def detect_and_annotate(self, frame: np.ndarray) -> np.ndarray:
        """Run person detection and draw bounding boxes on the frame."""
        return self.annotate(frame, self.detect(frame))
