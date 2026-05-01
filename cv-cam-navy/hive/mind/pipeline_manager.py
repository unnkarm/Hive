"""Manages per-camera detection pipelines with person re-identification.

The stream loop runs in a thread, while YOLO detection and
re-ID matching run in another dedicated thread. All workers share
a single globally loaded set of models to eliminate startup latency.
"""

import logging
import os
import queue
import sys
import threading
import time

import cv2
import numpy as np

from stream.consumer import StreamConsumer
from stream.producer import StreamProducer

logger = logging.getLogger(__name__)

DEFAULT_STREAM_FPS = float(os.getenv("PIPELINE_FPS", "10"))
DEFAULT_DETECT_FPS = float(os.getenv("DETECT_FPS", "2"))
RETRY_OPEN_DELAY = 5.0
REID_THRESHOLD = 0.50
FACE_THRESHOLD = 0.55
FACE_REGION_RATIO = 0.45

_MIND_DIR = os.path.dirname(os.path.abspath(__file__))
if _MIND_DIR not in os.environ.get("PYTHONPATH", "").split(os.pathsep):
    os.environ["PYTHONPATH"] = os.pathsep.join(
        filter(None, [_MIND_DIR, os.environ.get("PYTHONPATH", "")])
    )


def _build_annotated_url(node_id: str) -> str:
    """Construct the public URL for a node's annotated HLS stream."""
    base = os.getenv("ANNOTATED_STREAM_BASE_URL", "").rstrip("/")
    if not base:
        port = os.getenv("VIDEO_STREAM_PORT", "5000")
        base = f"http://localhost:{port}"
    return f"{base}/streams/{node_id}/index.m3u8"


# ── Detection Worker Thread ──────────────────────────────────────────

def _detection_worker(
    node_id: str,
    frame_queue: queue.Queue,
    result_queue: queue.Queue,
    stop_event: threading.Event,
    detect_fps: float,
    pipeline_manager, # Reference to the global pipeline manager to access models and gallery
):
    """Runs YOLO inference + re-ID matching + activity recognition in a dedicated thread."""
    log = logging.getLogger("DetectWorker")
    
    detector = pipeline_manager.detector
    embedder = pipeline_manager.reid_embedder
    face_detector = pipeline_manager.face_detector
    activity_rec = pipeline_manager.activity_rec
    emotion_rec = pipeline_manager.emotion_rec
    activity_store = pipeline_manager.activity_store

    CONTEXT_CLASSES = [0, 63, 66, 41, 39, 45, 56, 60, 67]

    # Track last activity per person (identified or unknown) to detect changes
    last_activities = {} 
    person_states = {} # Track mouth movement and orientation

    detect_interval = 1.0 / detect_fps
    log.info("Detection thread ready (%.1f fps, re-ID enabled)", detect_fps)

    try:
        while not stop_event.is_set():
            loop_start = time.monotonic()
            
            # Get the latest frame, skipping older ones
            frame = None
            try:
                while True:
                    frame = frame_queue.get_nowait()
            except queue.Empty:
                pass

            if frame is not None and frame.any():
                # Detect persons and context objects
                all_detections = detector.detect(frame, classes=CONTEXT_CLASSES)
                
                if all_detections:
                    log.info("[%s] Detected %d objects", node_id, len(all_detections))
                
                person_detections = [d for d in all_detections if d[5] == 0]
                context_detections = [d for d in all_detections if d[5] != 0]

                # Get latest gallery safely
                with pipeline_manager._gallery_lock:
                    gallery_ids = pipeline_manager._gallery_ids
                    gallery_names = pipeline_manager._gallery_names
                    gallery_matrix = pipeline_manager._gallery_matrix
                    face_matrix = pipeline_manager._face_matrix

                identified = []

                for det in person_detections:
                    x1, y1, x2, y2, conf, _ = det
                    x1, y1 = max(0, x1), max(0, y1)
                    x2, y2 = min(frame.shape[1], x2), min(frame.shape[0], y2)
                    
                    crop = frame[y1:y2, x1:x2]
                    name = None
                    person_id = "unknown"
                    emotion = None
                    emotion_kps = None
                    person_yaw = 0.0

                    if crop.size > 0 and gallery_matrix is not None:
                        crops_to_try = [crop, cv2.flip(crop, 1)]
                        
                        for current_crop in crops_to_try:
                            if name is not None: break
                            
                            face_region_y2 = max(1, int(current_crop.shape[0] * FACE_REGION_RATIO))
                            current_face_crop = current_crop[:face_region_y2, :]
                            
                            # 1. ArcFace identification
                            if face_matrix is not None and len(face_matrix) > 0:
                                face_results = face_detector.detect(current_face_crop)
                                if not face_results:
                                    face_results = face_detector.detect(current_crop)
                                
                                if face_results:
                                    f_res = face_results[0]
                                    f_emb = f_res['embedding']
                                    f_sims = face_matrix @ f_emb
                                    f_best = int(np.argmax(f_sims))
                                    face_score = float(f_sims[f_best])
                                    
                                    # Recognize emotion
                                    emotion = emotion_rec.recognize(f_res['kps'])
                                    if emotion == "neutral": emotion = None
                                    
                                    if face_score >= FACE_THRESHOLD:
                                        name = gallery_names[f_best]
                                        person_id = gallery_ids[f_best]
                                        log.info("[%s] Identified %s via ArcFace (score: %.2f)", node_id, name, face_score)
                                    
                                    # For talking detection
                                    emotion_kps = f_res['kps']
                                    person_yaw = face_detector._get_pose(f_res['kps'])['yaw']
                                    
                            # 2. ReID Fallback
                            if name is None:
                                emb = embedder.extract(current_crop)
                                sims = gallery_matrix @ emb
                                best = int(np.argmax(sims))
                                if float(sims[best]) >= REID_THRESHOLD:
                                    name = gallery_names[best]
                                    person_id = gallery_ids[best]
                                    log.info("[%s] Identified %s via Re-ID (score: %.2f)", node_id, name, float(sims[best]))

                    # 3. Activity Recognition
                    action, action_conf, act_features = activity_rec.recognize(frame, det, context_detections)
                    
                    # Track mouth width and activity history for smoothing
                    key = person_id if person_id != "unknown" else f"unknown_{x1}_{y1}"
                    if key not in person_states:
                        person_states[key] = {
                            "widths": [], 
                            "yaw": 0.0, 
                            "pos": (x1+(x2-x1)//2, y1+(y2-y1)//2),
                            "history": [], # For activity smoothing
                            "hand_at_face_frames": 0,
                            "eating_score": 0.0,
                            "talking_score": 0.0,
                            "mouth_std": 0.0
                        }
                    
                    # --- Improved Talking Detection ---
                    mouth_std = 0.0
                    if emotion_kps is not None:
                        mw = emotion_rec.get_mouth_width(emotion_kps)
                        person_states[key]["widths"].append(mw)
                        if len(person_states[key]["widths"]) > 10:
                            person_states[key]["widths"].pop(0)
                        
                        # Fluctuation check (std dev)
                        if len(person_states[key]["widths"]) >= 5:
                            mouth_std = float(np.std(person_states[key]["widths"]))
                            if mouth_std > 0.020: # High threshold for individual talking
                                person_states[key]["talking_score"] = min(1.0, person_states[key]["talking_score"] + 0.3)
                            else:
                                person_states[key]["talking_score"] *= 0.85
                                
                            # Individual "talking" is now DISABLED. 
                            # It only triggers in the social interaction pass below.
                        person_states[key]["mouth_std"] = mouth_std
                    
                    # --- Improved Eating Detection (Temporal) ---
                    # If hand is at face, increment frames
                    if act_features["hand_at_face"]:
                        person_states[key]["hand_at_face_frames"] = min(20, person_states[key]["hand_at_face_frames"] + 1)
                    else:
                        person_states[key]["hand_at_face_frames"] = max(0, person_states[key]["hand_at_face_frames"] - 1)
                    
                    # Eating criteria:
                    # 1. Mouth moving in "chewing range" (Broadened range)
                    # 2. Hand was recently at face
                    # 3. Near food objects helps speed up detection
                    is_chewing = 0.002 < mouth_std < 0.018
                    
                    if act_features["near_food_object"]:
                        # Faster trigger if food objects are present
                        if person_states[key]["hand_at_face_frames"] >= 1 and (is_chewing or mouth_std == 0):
                            action = "eating"
                            person_states[key]["eating_score"] = min(1.0, person_states[key]["eating_score"] + 0.2)
                    else:
                        # More evidence needed without food objects
                        if person_states[key]["hand_at_face_frames"] >= 3 and is_chewing:
                            action = "eating"
                            person_states[key]["eating_score"] = min(1.0, person_states[key]["eating_score"] + 0.15)

                    # Decay eating score and apply it
                    person_states[key]["eating_score"] *= 0.92
                    if person_states[key]["eating_score"] > 0.4:
                        # Only override if we are not currently doing something even more specific like talking on phone
                        if action in ["sitting", "standing", "working on field"]:
                            action = "eating"

                    # Apply Activity Smoothing (Mode over last 20 detections for stability)
                    person_states[key]["history"].append(action)
                    if len(person_states[key]["history"]) > 20:
                        person_states[key]["history"].pop(0)
                    
                    if len(person_states[key]["history"]) >= 3:
                        # Find most frequent action
                        from collections import Counter
                        counts = Counter(person_states[key]["history"])
                        smoothed_action = counts.most_common(1)[0][0]
                        action = smoothed_action

                    # Store current state for social pass
                    person_states[key]["yaw"] = person_yaw
                    person_states[key]["pos"] = (x1+(x2-x1)//2, y1+(y2-y1)//2)
                    person_states[key]["bbox"] = (x1, y1, x2, y2)

                    if emotion:
                        action = f"{action} ({emotion})"
                    
                    # 4. Log Activity Change
                    identified.append({
                        "id": key,
                        "det": (x1, y1, x2, y2, conf, name, action),
                        "person_id": person_id,
                        "name": name,
                        "action": action,
                        "conf": action_conf,
                        "mouth_std": person_states[key].get("mouth_std", 0.0)
                    })

                # --- 5. Social Interaction Pass ---
                for i in range(len(identified)):
                    for j in range(i + 1, len(identified)):
                        p1, p2 = identified[i], identified[j]
                        k1, k2 = p1["id"], p2["id"]
                        
                        pos1, pos2 = person_states[k1]["pos"], person_states[k2]["pos"]
                        yaw1, yaw2 = person_states[k1]["yaw"], person_states[k2]["yaw"]
                        
                        dist = np.sqrt((pos1[0]-pos2[0])**2 + (pos1[1]-pos2[1])**2)
                        
                        # Threshold based on avg person height
                        avg_h = ((p1["det"][3]-p1["det"][1]) + (p2["det"][3]-p2["det"][1])) / 2
                        
                        if dist < avg_h * 1.1:
                            if (pos2[0] > pos1[0] and yaw1 > 40 and yaw2 < -40) or \
                               (pos1[0] > pos2[0] and yaw1 < -40 and yaw2 > 40):
                                # Require some history of mouth movement
                                if p1.get("mouth_std", 0) > 0.015 or p2.get("mouth_std", 0) > 0.015 or \
                                   person_states[k1].get("talking_score", 0) > 0.4 or person_states[k2].get("talking_score", 0) > 0.4:
                                    p1["action"] = "talking" if "talking" not in p1["action"] else p1["action"]
                                    p2["action"] = "talking" if "talking" not in p2["action"] else p2["action"]

                # Final results assembly
                final_results = []
                for det in context_detections:
                    final_results.append(det)

                for p in identified:
                    det = list(p["det"])
                    det[6] = p["action"]
                    final_results.append(tuple(det))
                    
                    # Log activity change and update session durations (only for known people)
                    if p["person_id"] != "unknown":
                        key, action = p["id"], p["action"]
                        
                        try:
                            activity_store.update_session(
                                person_id=p["person_id"],
                                name=p["name"] or "Unknown",
                                action=action,
                                node_id=node_id,
                            )
                        except Exception as e:
                            log.error("Failed to update session: %s", e)

                        if key not in last_activities or last_activities[key] != action:
                            try:
                                activity_store.log_activity(
                                    person_id=p["person_id"],
                                    name=p["name"] or "Unknown",
                                    action=action,
                                    confidence=p["conf"],
                                    node_id=node_id,
                                )
                            except Exception as e:
                                log.error("Failed to log activity: %s", e)
                        last_activities[key] = action

                try:
                    result_queue.put_nowait(final_results)
                except queue.Full:
                    pass

            elapsed = time.monotonic() - loop_start
            remaining = detect_interval - elapsed
            if remaining > 0:
                stop_event.wait(remaining)
    except Exception:
        log.exception("Detection thread error")
    finally:
        log.info("Detection thread exiting")


# ── Camera worker ─────────────────────────────────────────────────────

class _CameraWorker:
    """Runs streaming and detection in separate threads."""

    def __init__(
        self,
        node_id: str,
        stream_url: str,
        node_store,
        pipeline_manager,
        stream_fps: float = DEFAULT_STREAM_FPS,
        detect_fps: float = DEFAULT_DETECT_FPS,
    ):
        self.node_id = node_id
        self.stream_url = stream_url
        self.node_store = node_store
        self.pipeline_manager = pipeline_manager
        self.stream_fps = stream_fps
        self.detect_fps = detect_fps

        self._stream_thread: threading.Thread | None = None
        self._detect_thread: threading.Thread | None = None
        self._stop_event = threading.Event()

        self._frame_queue = queue.Queue(maxsize=4)
        self._result_queue = queue.Queue(maxsize=4)
        self._detections: list = []

    def start(self):
        self._stop_event.clear()
        
        # Start detection thread immediately without waiting for stream
        self._detect_thread = threading.Thread(
            target=_detection_worker,
            args=(
                self.node_id,
                self._frame_queue,
                self._result_queue,
                self._stop_event,
                self.detect_fps,
                self.pipeline_manager,
            ),
            name=f"detect-{self.node_id}",
            daemon=True,
        )
        self._detect_thread.start()
        logger.info("Detection thread started instantly for node %s", self.node_id)

        self._stream_thread = threading.Thread(
            target=self._stream_loop,
            name=f"stream-{self.node_id}",
            daemon=True,
        )
        self._stream_thread.start()

    def stop(self):
        self._stop_event.set()

        if self._stream_thread is not None:
            self._stream_thread.join(timeout=5)
            self._stream_thread = None

        if self._detect_thread is not None:
            self._detect_thread.join(timeout=5)
            self._detect_thread = None

    @property
    def is_alive(self) -> bool:
        stream_ok = self._stream_thread is not None and self._stream_thread.is_alive()
        detect_ok = self._detect_thread is not None and self._detect_thread.is_alive()
        return stream_ok and detect_ok

    def _drain_detections(self):
        latest = None
        try:
            while True:
                latest = self._result_queue.get_nowait()
        except queue.Empty:
            pass
        if latest is not None:
            self._detections = latest

    def _stream_loop(self):
        consumer = StreamConsumer(self.stream_url, target_fps=self.stream_fps)
        producer = None

        try:
            if not consumer.open():
                logger.error("Cannot open stream for node %s, worker exiting", self.node_id)
                return

            producer = StreamProducer(
                node_id=self.node_id,
                width=consumer.width,
                height=consumer.height,
                fps=self.stream_fps,
            )
            producer.start()

            annotated_url = _build_annotated_url(self.node_id)
            self.node_store.set_annotated_stream_url(self.node_id, annotated_url)
            logger.info(
                "Pipeline streaming running for node %s -> %s (stream %gfps, detect %gfps)",
                self.node_id, annotated_url, self.stream_fps, self.detect_fps,
            )

            while not self._stop_event.is_set():
                loop_start = time.monotonic()

                ok, frame = consumer.read_frame()
                if not ok:
                    logger.warning("Lost stream for node %s, retrying...", self.node_id)
                    consumer.release()
                    time.sleep(RETRY_OPEN_DELAY)
                    if self._stop_event.is_set():
                        break
                    if not consumer.open():
                        logger.error("Retry failed for node %s, worker exiting", self.node_id)
                        break
                    continue

                # Pass frame to detection thread
                try:
                    self._frame_queue.put_nowait(frame)
                except queue.Full:
                    pass

                self._drain_detections()

                annotated = self.pipeline_manager.detector.annotate(frame, self._detections)

                try:
                    producer.write_frame(annotated)
                except RuntimeError:
                    logger.error("Producer died for node %s, worker exiting", self.node_id)
                    break

                elapsed = time.monotonic() - loop_start
                sleep_time = consumer.frame_interval - elapsed
                if sleep_time > 0:
                    self._stop_event.wait(sleep_time)

        except Exception:
            logger.exception("Unexpected error in stream loop for node %s", self.node_id)
        finally:
            consumer.release()
            if producer is not None:
                producer.stop()
            self.node_store.set_annotated_stream_url(self.node_id, None)
            logger.info("Stream loop stopped for node %s", self.node_id)


# ── Pipeline manager ──────────────────────────────────────────────────

class PipelineManager:
    """Coordinates detection pipelines across all online camera nodes.
    
    Models are loaded globally once at initialization to eliminate startup latency.
    """

    def __init__(self, node_store, person_store, activity_store, 
                 detector, face_detector, reid_embedder, activity_rec, emotion_rec):
        self.node_store = node_store
        self.person_store = person_store
        self.activity_store = activity_store
        
        # Pre-loaded AI models
        self.detector = detector
        self.face_detector = face_detector
        self.reid_embedder = reid_embedder
        self.activity_rec = activity_rec
        self.emotion_rec = emotion_rec

        self._workers: dict[str, _CameraWorker] = {}
        self._lock = threading.Lock()

        self._gallery_lock = threading.Lock()
        self._gallery_ids = []
        self._gallery_names = []
        self._gallery_matrix = None
        self._face_matrix = None
        
        self._load_gallery()

    def _load_gallery(self):
        """Read the person gallery from DB and store it in memory."""
        ids, names, matrix, face_matrix = self.person_store.get_all_embeddings()
        with self._gallery_lock:
            self._gallery_ids = ids
            self._gallery_names = names
            self._gallery_matrix = matrix
            self._face_matrix = face_matrix
        logger.info("Gallery loaded in memory: %d persons", len(ids))

    def refresh_gallery(self):
        """Reload the gallery from DB."""
        self._load_gallery()

    def start(self):
        """Start pipelines for all online nodes that have a stream URL."""
        nodes = self.node_store.get_all()
        started = 0
        with self._lock:
            for node in nodes:
                node_id = node["node_id"]
                stream_url = node.get("rtsp_url") or node.get("stream_url")
                if node["status"] != "online" or not stream_url:
                    continue
                if node_id in self._workers and self._workers[node_id].is_alive:
                    continue

                worker = _CameraWorker(
                    node_id=node_id,
                    stream_url=stream_url,
                    node_store=self.node_store,
                    pipeline_manager=self,
                )
                worker.start()
                self._workers[node_id] = worker
                started += 1

        logger.info("Pipeline start: launched %d worker(s)", started)

    def stop(self):
        """Stop all running pipelines."""
        with self._lock:
            for worker in self._workers.values():
                worker.stop()
            self._workers.clear()
        logger.info("All pipelines stopped")

    def cleanup(self):
        """Stop pipelines."""
        self.stop()

    def get_status(self) -> dict:
        """Return current pipeline status."""
        with self._lock:
            active = {
                nid: {
                    "alive": w.is_alive,
                    "stream_url": w.stream_url,
                }
                for nid, w in self._workers.items()
            }
        return {
            "running": len(active) > 0,
            "cameras": active,
        }
