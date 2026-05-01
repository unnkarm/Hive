import os
import sys

# Add hive/mind to path
sys.path.insert(0, os.path.join(os.getcwd(), "hive", "mind"))

from cv.face_detector import FaceDetector

fd = FaceDetector()
print(f"Det model path: {fd.det_model_path}")
print(f"Rec model path: {fd.rec_model_path}")
print(f"Det exists: {os.path.exists(fd.det_model_path)}")
print(f"Rec exists: {os.path.exists(fd.rec_model_path)}")
print(f"Det session: {fd.det_session}")
print(f"Rec session: {fd.rec_session}")
