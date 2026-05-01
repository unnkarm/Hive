import multiprocessing
from multiprocessing import shared_memory
import numpy as np
import sys
import os

# Add hive/mind to path
sys.path.insert(0, os.path.join(os.getcwd(), "hive", "mind"))

from cv.gallery import GallerySharedMemory, SHM_GALLERY_NAME

try:
    lock = multiprocessing.Lock()
    gallery_shm = GallerySharedMemory(create=False, shm_name=SHM_GALLERY_NAME, lock=lock)
    names, matrix, face_matrix = gallery_shm.read()
    print(f"Gallery count: {len(names)}")
    for i, name in enumerate(names):
        has_reid = matrix is not None and not np.all(matrix[i] == 0)
        has_face = face_matrix is not None and not np.all(face_matrix[i] == 0)
        print(f"  [{i}] Name: {name}, Has ReID: {has_reid}, Has Face: {has_face}")
except Exception as e:
    print(f"Error reading gallery SHM: {e}")
