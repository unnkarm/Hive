import sys
import os
import numpy as np
import cv2

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from cv.activity_recognizer import ActivityRecognizer
from cv.emotion_recognizer import EmotionRecognizer

def test_talking_detection():
    print("Testing Talking Detection...")
    ar = ActivityRecognizer()
    er = EmotionRecognizer()
    
    # Mock person (x1, y1, x2, y2, conf, cls)
    person_det = (100, 100, 200, 400, 0.9, 0)
    person_h = 400 - 100
    
    # 1. Test Talking on Phone
    # Phone in head region (top 1/3)
    phone_det_head = (180, 110, 210, 150, 0.8, 67) # Near head
    action, conf = ar.recognize(np.zeros((640,640,3)), person_det, [phone_det_head])
    print(f"Action with phone near head: {action} (Expected: talking on phone)")
    
    # Phone in hand region (not head)
    phone_det_hand = (180, 250, 210, 290, 0.8, 67) # Lower down
    action, conf = ar.recognize(np.zeros((640,640,3)), person_det, [phone_det_hand])
    print(f"Action with phone near hand: {action} (Expected: standing/working on field)")

def test_mouth_movement():
    print("\nTesting Mouth Movement Logic (Standard Deviation)...")
    er = EmotionRecognizer()
    
    # Simulation of mouth width fluctuation
    # Eye distance = 50
    # Mouth widths: [20, 25, 20, 25, 20] -> normalized: [0.4, 0.5, 0.4, 0.5, 0.4]
    widths = [0.4, 0.5, 0.4, 0.5, 0.4]
    std = np.std(widths)
    print(f"Mouth width std dev: {std:.4f} (Threshold: 0.015)")
    if std > 0.015:
        print("Mouth movement detected!")
    else:
        print("Mouth stable.")

def test_social_interaction():
    print("\nTesting Social Interaction (Facing each other)...")
    # Simulation of two people
    # Person 1: at x=100, facing Right (yaw > 0)
    # Person 2: at x=200, facing Left (yaw < 0)
    pos1 = (100, 250)
    yaw1 = 45
    
    pos2 = (220, 250)
    yaw2 = -45
    
    dist = np.sqrt((pos1[0]-pos2[0])**2 + (pos1[1]-pos2[1])**2)
    print(f"Distance: {dist:.1f}")
    
    # Logic from pipeline_manager
    if (pos2[0] > pos1[0] and yaw1 > 20 and yaw2 < -20):
        print("People are facing each other! -> Talking")
    else:
        print("Not facing each other.")

if __name__ == "__main__":
    try:
        test_talking_detection()
        test_mouth_movement()
        test_social_interaction()
    except Exception as e:
        print(f"Error during verification: {e}")
