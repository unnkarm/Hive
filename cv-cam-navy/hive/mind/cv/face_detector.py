"""ArcFace based face detector and embedder."""

import logging
import os
import cv2
import numpy as np
import onnxruntime as ort

logger = logging.getLogger(__name__)

try:
    import torch
    torch_lib = os.path.join(os.path.dirname(torch.__file__), 'lib')
    if os.path.exists(torch_lib):
        os.add_dll_directory(torch_lib)
except Exception:
    pass


class FaceDetector:
    """Detects faces via SCRFD and extracts embeddings via ArcFace using ONNX."""

    def __init__(
        self,
        det_model_path: str = "models/det_2.5g.onnx",
        rec_model_path: str = "models/rec_model.onnx"
    ):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        self.det_model_path = det_model_path if os.path.isabs(det_model_path) else os.path.join(base_dir, det_model_path)
        self.rec_model_path = rec_model_path if os.path.isabs(rec_model_path) else os.path.join(base_dir, rec_model_path)
        
        if not os.path.exists(self.det_model_path) or not os.path.exists(self.rec_model_path):
            logger.error(f"Missing models. Det: {self.det_model_path}, Rec: {self.rec_model_path}")
            # We don't raise immediately so that if it's missing, the app doesn't crash on startup 
            # if we just want to run ReID. However, it will fail on detection.
            
        self.providers = ['CPUExecutionProvider']
        available_providers = ort.get_available_providers()
        if 'CUDAExecutionProvider' in available_providers:
            self.providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
            
        try:
            self.det_session = ort.InferenceSession(self.det_model_path, providers=self.providers)
            self.rec_session = ort.InferenceSession(self.rec_model_path, providers=self.providers)
            
            det_active = self.det_session.get_providers()
            if 'CUDAExecutionProvider' in det_active:
                logger.info("FaceDetector GPU Acceleration: ACTIVE (CUDA)")
            else:
                logger.info("FaceDetector GPU Acceleration: INACTIVE (CPU)")
        except Exception as e:
            logger.error(f"Failed to load ONNX models: {e}")
            self.det_session = None
            self.rec_session = None
            
        self.input_size = (640, 640)
        self.conf_threshold = 0.5
        self.nms_threshold = 0.4
        
        self.strides = []
        self.anchor_grids = []
        if self.det_session is not None:
            self._init_anchors()

    def _init_anchors(self):
        self.strides = [8, 16, 32]
        self.anchor_grids = []
        for stride in self.strides:
            h, w = self.input_size[0] // stride, self.input_size[1] // stride
            anchor_grid = np.meshgrid(np.arange(w), np.arange(h))
            anchor_grid = np.stack(anchor_grid, axis=-1).reshape(-1, 2)
            self.anchor_grids.append(anchor_grid * stride)

    def detect(self, img: np.ndarray) -> list[dict]:
        """Detect faces and return list of dicts with 'bbox', 'kps', 'embedding', 'pose'."""
        if self.det_session is None or self.rec_session is None:
            return []
            
        h, w, _ = img.shape
        if h == 0 or w == 0:
            return []
            
        scale_x = w / self.input_size[1]
        scale_y = h / self.input_size[0]
        
        blob = cv2.dnn.blobFromImage(img, 1.0/128, self.input_size, (127.5, 127.5, 127.5), swapRB=True)
        outputs = self.det_session.run(None, {self.det_session.get_inputs()[0].name: blob})
        
        all_bboxes, all_scores, all_kps = [], [], []
        
        for i, stride in enumerate(self.strides):
            scores = outputs[i].flatten()
            bboxes = outputs[i + 3]
            kps = outputs[i + 6]
            centers = self.anchor_grids[i]
            
            num_anchors = scores.shape[0] // centers.shape[0]
            
            idx = np.where(scores > self.conf_threshold)[0]
            for j in idx:
                center_idx = j // num_anchors
                cx, cy = centers[center_idx]
                
                d_x1, d_y1, d_x2, d_y2 = bboxes[j]
                x1 = (cx - d_x1 * stride) * scale_x
                y1 = (cy - d_y1 * stride) * scale_y
                x2 = (cx + d_x2 * stride) * scale_x
                y2 = (cy + d_y2 * stride) * scale_y
                
                kp = kps[j].reshape(-1, 2)
                kp_res = np.zeros_like(kp)
                kp_res[:, 0] = (cx + kp[:, 0] * stride) * scale_x
                kp_res[:, 1] = (cy + kp[:, 1] * stride) * scale_y
                
                all_bboxes.append([float(x1), float(y1), float(x2 - x1), float(y2 - y1)])
                all_scores.append(float(scores[j]))
                all_kps.append(kp_res)

        if not all_bboxes: 
            return []
        
        indices = cv2.dnn.NMSBoxes(all_bboxes, all_scores, self.conf_threshold, self.nms_threshold)
        
        results = []
        if len(indices) > 0:
            for i in indices.flatten():
                x, y, w_box, h_box = all_bboxes[i]
                bbox = [x, y, x + w_box, y + h_box]
                kp = all_kps[i]
                
                aligned_face = self._align_face(img, kp)
                if aligned_face is None:
                    continue
                embedding = self._get_embedding(aligned_face)
                pose = self._get_pose(kp)
                
                results.append({
                    'bbox': bbox,
                    'kps': kp,
                    'embedding': embedding,
                    'pose': pose
                })
        return results

    def _align_face(self, img: np.ndarray, kps: np.ndarray) -> np.ndarray | None:
        dst = np.array([
            [38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366],
            [41.5493, 92.3655], [70.7299, 92.2041]
        ], dtype=np.float32)
        res = cv2.estimateAffinePartial2D(kps, dst)
        if res is None or res[0] is None:
            return None
        tform = res[0]
        return cv2.warpAffine(img, tform, (112, 112))

    def _get_embedding(self, face_img: np.ndarray) -> np.ndarray:
        blob = cv2.dnn.blobFromImage(face_img, 1.0/127.5, (112, 112), (127.5, 127.5, 127.5), swapRB=True)
        embedding = self.rec_session.run(None, {self.rec_session.get_inputs()[0].name: blob})[0]
        return embedding.flatten() / np.linalg.norm(embedding)

    def _get_pose(self, kps: np.ndarray) -> dict:
        l_eye, r_eye, nose = kps[0], kps[1], kps[2]
        d1 = np.linalg.norm(l_eye - nose)
        d2 = np.linalg.norm(r_eye - nose)
        if d1 + d2 == 0:
            return {"yaw": 0.0}
        return {"yaw": (d1 - d2) / (d1 + d2) * 90}

    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Cosine similarity. Expects L2-normalized vectors."""
        return float(np.dot(a, b))
