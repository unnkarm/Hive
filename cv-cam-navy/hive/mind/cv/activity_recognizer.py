"""Human Activity Recognition using Pose and Context."""
import logging
import numpy as np
import cv2
from ultralytics import YOLO

logger = logging.getLogger(__name__)

class ActivityRecognizer:
    def __init__(self, pose_model="yolov8n-pose.pt"):
        logger.info("Loading Pose model: %s", pose_model)
        self.pose_model = YOLO(pose_model)
        
        # COCO class IDs for context
        self.LAPTOP = 63
        self.KEYBOARD = 66
        self.CUP = 41
        self.BOTTLE = 39
        self.BOWL = 45
        self.CHAIR = 56
        self.DINING_TABLE = 60
        self.CELL_PHONE = 67
        
        # Action labels
        self.STANDING = "standing"
        self.SITTING = "sitting"
        self.WORKING_ON_LAPTOP = "working on laptop"
        self.WORKING_ON_FIELD = "working on field"
        self.EATING = "eating"
        self.TALKING = "talking"
        self.TALKING_ON_PHONE = "talking on phone"
        self.UNKNOWN = "unknown"

    def recognize(self, frame: np.ndarray, person_det, context_dets) -> tuple[str, float, dict]:
        """
        Infers activity based on pose and surrounding objects.
        Returns (action, confidence, features)
        """
        x1, y1, x2, y2, conf, _ = person_det
        
        # Features for temporal analysis
        features = {
            "hand_at_face": False,
            "near_food_object": False,
            "hand_near_food": False
        }

        # 1. Posture Detection via bounding box and Pose
        person_w = x2 - x1
        person_h = y2 - y1
        
        if person_h == 0 or person_w == 0:
            return self.UNKNOWN, 0.0, features

        # Heuristic 1: Aspect Ratio (fast)
        posture = self.STANDING
        if person_h < person_w * 1.1: # Wider/squatter box usually means sitting or crouching
            posture = self.SITTING

        # Heuristic 2: Pose Analysis (if high confidence)
        crop = frame[max(0, y1):min(frame.shape[0], y2), max(0, x1):min(frame.shape[1], x2)]
        if crop.size > 0:
            results = self.pose_model(crop, verbose=False, conf=0.3)
            if results and len(results[0].keypoints.data) > 0:
                kp = results[0].keypoints.data[0].cpu().numpy()
                hip_y = self._get_avg_y(kp, [11, 12])
                shoulder_y = self._get_avg_y(kp, [5, 6])
                knee_y = self._get_avg_y(kp, [13, 14])
                
                if hip_y is not None and shoulder_y is not None:
                    if knee_y is not None:
                        upper_body_len = hip_y - shoulder_y
                        lower_body_len = knee_y - hip_y
                        if lower_body_len < upper_body_len * 0.7:
                            posture = self.SITTING
                        else:
                            posture = self.STANDING
                    else:
                        if hip_y > person_h * 0.7:
                            posture = self.STANDING

                # Hand-to-mouth eating detection
                nose = self._get_kp(kp, 0)
                l_wrist = self._get_kp(kp, 9)
                r_wrist = self._get_kp(kp, 10)
                l_shoulder = self._get_kp(kp, 5)
                r_shoulder = self._get_kp(kp, 6)
                
                hand_at_face = False
                
                # Heuristic A: Wrist above shoulder
                if l_shoulder is not None and l_wrist is not None:
                    if l_wrist[1] < l_shoulder[1]:
                        hand_at_face = True
                if r_shoulder is not None and r_wrist is not None:
                    if r_wrist[1] < r_shoulder[1]:
                        hand_at_face = True
                        
                # Heuristic B: Wrist near face
                # Heuristic B: Wrist near face
                if nose is not None:
                    for wrist in [l_wrist, r_wrist]:
                        if wrist is not None:
                            dist = ((nose[0] - wrist[0])**2 + (nose[1] - wrist[1])**2)**0.5
                            if dist < person_h * 0.35:  # Relaxed distance for better detection
                                hand_at_face = True
                        
                features["hand_at_face"] = hand_at_face

        # 2. Contextual Activity Override
        action = posture
        
        near_desk_objects = False
        near_laptop = False
        near_phone = False
        
        # Define "head region" as top 1/2 of the bounding box
        head_region_y2 = y1 + person_h // 2

        food_objects = [self.CUP, self.BOTTLE, self.BOWL, self.DINING_TABLE]

        for cx1, cy1, cx2, cy2, cconf, ccls in context_dets:
            if not self._is_near((x1, y1, x2, y2), (cx1, cy1, cx2, cy2), padding=60): # Stricter padding
                continue
                
            if ccls == self.CELL_PHONE:
                if cy1 < head_region_y2 or cy2 < head_region_y2:
                    near_phone = True
            elif ccls in [self.LAPTOP, self.KEYBOARD]:
                near_laptop = True
                near_desk_objects = True
            elif ccls in [self.CHAIR, self.DINING_TABLE]:
                near_desk_objects = True
            elif ccls in food_objects:
                features["near_food_object"] = True
                near_desk_objects = True

        if near_phone:
            action = self.TALKING_ON_PHONE
        elif near_laptop and posture == self.SITTING:
            action = self.WORKING_ON_LAPTOP
        elif posture == self.STANDING and not near_desk_objects:
            action = self.WORKING_ON_FIELD
        elif posture == self.SITTING and near_desk_objects:
            action = self.SITTING
            
        return action, conf, features

    def _get_avg_y(self, kp, indices, threshold=0.5):
        vals = [kp[i][1] for i in indices if kp[i][2] > threshold]
        return sum(vals) / len(vals) if vals else None

    def _get_kp(self, kp, idx, threshold=0.2):
        if len(kp) > idx and kp[idx][2] > threshold:
            return kp[idx][:2]
        return None

    def _is_near(self, boxA, boxB, padding=100):
        # Check if boxes are close or overlapping
        return not (boxA[2] + padding < boxB[0] or 
                    boxA[0] - padding > boxB[2] or 
                    boxA[3] + padding < boxB[1] or 
                    boxA[1] - padding > boxB[3])
