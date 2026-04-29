import sys
import os

# Add the hive/mind directory to sys.path
sys.path.append(os.path.abspath("d:/CV-intern-main/cv-cam-navy/hive/mind"))

try:
    from cv.detector import PersonDetector
    print("PersonDetector imported successfully")
except Exception as e:
    print(f"Error importing PersonDetector: {e}")
    import traceback
    traceback.print_exc()
