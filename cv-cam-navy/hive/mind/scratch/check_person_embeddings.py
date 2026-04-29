from database import PersonStore
import os
import numpy as np
from dotenv import load_dotenv

load_dotenv()
person_store = PersonStore()
names, matrix, face_matrix = person_store.get_all_embeddings()
print(f"Found {len(names)} persons in gallery")
for i, name in enumerate(names):
    has_reid = matrix is not None and i < len(matrix) and not np.all(matrix[i] == 0)
    has_face = face_matrix is not None and i < len(face_matrix) and not np.all(face_matrix[i] == 0)
    print(f"Person: {name}, Has ReID Embedding: {has_reid}, Has Face Embedding: {has_face}")
