"""Manages per-camera detection pipelines with person re-identification.

The stream loop runs in a thread (main process), while YOLO detection and
re-ID matching run in a separate subprocess so that their GIL activity
never stalls frame output.  All workers share a single gallery via shared
memory for cross-camera identification.
"""

import logging
import multiprocessing
import os
import queue
import sys
import threading
import time
from multiprocessing import shared_memory

import cv2
import numpy as np

from cv.detector import PersonDetector
from stream.consumer import StreamConsumer
from stream.producer import StreamProducer

logger = logging.getLogger(__name__)

DEFAULT_STREAM_FPS = float(os.getenv("PIPELINE_FPS", "10"))
DEFAULT_DETECT_FPS = float(os.getenv("DETECT_FPS", "2"))
RETRY_OPEN_DELAY = 5.0
REID_THRESHOLD = 0.50
FACE_THRESHOLD = 0.50
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


# ── Detection + re-ID subprocess ─────────────────────────────────────

def _detection_worker(
    node_id: str,
    model_size: str,
    shm_name: str,
    frame_shape: tuple,
    result_queue: multiprocessing.Queue,
    stop_event: multiprocessing.Event,
    detect_fps: float,
    gallery_shm_name: str,
    gallery_lock: multiprocessing.Lock,
):
    """Runs YOLO inference + re-ID matching + activity recognition in a dedicated process."""
    import logging as _log
    _log.basicConfig(
        level=_log.DEBUG,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%H:%M:%S",
    )
    log = _log.getLogger("DetectWorker")

    for p in [_MIND_DIR] + sys.path:
        if p and p not in sys.path:
            sys.path.insert(0, p)

    from cv.detector import PersonDetector as _PD
    from cv.gallery import GallerySharedMemory
    from cv.reid import ReIdEmbedder
    from cv.face_detector import FaceDetector
    from cv.activity_recognizer import ActivityRecognizer
    from cv.emotion_recognizer import EmotionRecognizer
    from database import ActivityStore

    log.info("Loading YOLO model: %s", model_size)
    detector = _PD(model_size)
    
    # We want to detect persons (0) and context objects
    CONTEXT_CLASSES = [0, 63, 66, 41, 39, 45, 56, 60, 67]

    log.info("Loading re-ID model")
    embedder = ReIdEmbedder()
    
    log.info("Loading ArcFace model")
    face_detector = FaceDetector()
    
    log.info("Loading Activity recognizer")
    activity_rec = ActivityRecognizer()
    log.info("Loading Emotion recognizer")
    emotion_rec = EmotionRecognizer()
    activity_store = ActivityStore()

    # Track last activity per person (identified or unknown) to detect changes
    last_activities = {} 
    person_states = {} # Track mouth movement and orientation

    gallery_shm = GallerySharedMemory(
        create=False, shm_name=gallery_shm_name, lock=gallery_lock,
    )

    shm = shared_memory.SharedMemory(name=shm_name)
    frame_buf = np.ndarray(frame_shape, dtype=np.uint8, buffer=shm.buf)

    detect_interval = 1.0 / detect_fps
    log.info("Detection subprocess ready (%.1f fps, re-ID enabled)", detect_fps)

    try:
        while not stop_event.is_set():
            loop_start = time.monotonic()

            frame = frame_buf.copy()
            if frame.any():
                # Detect persons and context objects
                all_detections = detector.detect(frame, classes=CONTEXT_CLASSES)
                
                if all_detections:
                    log.info("[%s] Detected %d objects", node_id, len(all_detections))
                
                person_detections = [d for d in all_detections if d[5] == 0]
                context_detections = [d for d in all_detections if d[5] != 0]

                gallery_ids, gallery_names, gallery_matrix, face_matrix = gallery_shm.read()

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
                    action, action_conf = activity_rec.recognize(frame, det, context_detections)
                    
                    # Track mouth width for talking detection
                    key = person_id if person_id != "unknown" else f"unknown_{x1}_{y1}"
                    if key not in person_states:
                        person_states[key] = {"widths": [], "yaw": 0.0, "pos": (x1+(x2-x1)//2, y1+(y2-y1)//2)}
                    
                    if emotion_kps is not None:
                        mw = emotion_rec.get_mouth_width(emotion_kps)
                        person_states[key]["widths"].append(mw)
                        if len(person_states[key]["widths"]) > 10:
                            person_states[key]["widths"].pop(0)
                        
                        # Fluctuation check (std dev)
                        if len(person_states[key]["widths"]) >= 5:
                            std = np.std(person_states[key]["widths"])
                            if std > 0.008: # Threshold for mouth movement
                                action = "talking"
                    
                    # Store current state for social pass
                    person_states[key]["yaw"] = person_yaw
                    person_states[key]["pos"] = (x1+(x2-x1)//2, y1+(y2-y1)//2)
                    person_states[key]["bbox"] = (x1, y1, x2, y2)

                    if emotion:
                        action = f"{action} ({emotion})"
                    
                    # 4. Log Activity Change (Temporary, will be updated in social pass if needed)
                    identified.append({
                        "id": key,
                        "det": (x1, y1, x2, y2, conf, name, action),
                        "person_id": person_id,
                        "name": name,
                        "action": action,
                        "conf": action_conf
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
                        if dist < avg_h * 1.5:
                            # Facing each other?
                            # Vector from p1 to p2
                            vec = (pos2[0] - pos1[0], pos2[1] - pos1[1])
                            angle_to_p2 = np.degrees(np.arctan2(vec[1], vec[0]))
                            
                            # Rough yaw check
                            # Yaw 0 is facing camera. 
                            # If p2 is to the right of p1, p1 should have yaw > 0 and p2 should have yaw < 0
                            if (pos2[0] > pos1[0] and yaw1 > 20 and yaw2 < -20) or \
                               (pos1[0] > pos2[0] and yaw1 < -20 and yaw2 > 20):
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
                        
                        # Continuously update session for duration tracking
                        try:
                            activity_store.update_session(
                                person_id=p["person_id"],
                                name=p["name"] or "Unknown",
                                action=action,
                                node_id=node_id,
                            )
                        except Exception as e:
                            log.error("Failed to update session: %s", e)

                        # Log discrete events only when the action changes
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
        log.exception("Detection subprocess error")
    finally:
        shm.close()
        gallery_shm.close()
        log.info("Detection subprocess exiting")


# ── Camera worker ─────────────────────────────────────────────────────

class _CameraWorker:
    """Runs streaming in a thread and detection in a subprocess.

    The stream thread reads RTSP frames, draws cached detection boxes,
    and pipes annotated frames to FFmpeg -- all without competing for the
    GIL with YOLO inference.
    """

    def __init__(
        self,
        node_id: str,
        stream_url: str,
        model_size: str,
        node_store,
        gallery_shm_name: str,
        gallery_lock: multiprocessing.Lock,
        stream_fps: float = DEFAULT_STREAM_FPS,
        detect_fps: float = DEFAULT_DETECT_FPS,
    ):
        self.node_id = node_id
        self.stream_url = stream_url
        self.model_size = model_size
        self.node_store = node_store
        self.gallery_shm_name = gallery_shm_name
        self.gallery_lock = gallery_lock
        self.stream_fps = stream_fps
        self.detect_fps = detect_fps

        self._stream_thread: threading.Thread | None = None
        self._detect_process: multiprocessing.Process | None = None
        self._stop_thread_event = threading.Event()
        self._stop_process_event: multiprocessing.Event | None = None

        self._detection_queue: multiprocessing.Queue | None = None
        self._shm: shared_memory.SharedMemory | None = None
        self._detections: list = []

    # ── lifecycle ─────────────────────────────────────────────────

    def start(self):
        self._stop_thread_event.clear()
        self._stream_thread = threading.Thread(
            target=self._stream_loop,
            name=f"stream-{self.node_id}",
            daemon=True,
        )
        self._stream_thread.start()

    def _start_detection_process(self, width: int, height: int):
        """Spawn the detection subprocess once we know frame dimensions."""
        frame_shape = (height, width, 3)
        frame_nbytes = int(np.prod(frame_shape)) * np.dtype(np.uint8).itemsize

        self._shm = shared_memory.SharedMemory(create=True, size=frame_nbytes)
        self._detection_queue = multiprocessing.Queue(maxsize=4)
        self._stop_process_event = multiprocessing.Event()

        self._detect_process = multiprocessing.Process(
            target=_detection_worker,
            args=(
                self.node_id,
                self.model_size,
                self._shm.name,
                frame_shape,
                self._detection_queue,
                self._stop_process_event,
                self.detect_fps,
                self.gallery_shm_name,
                self.gallery_lock,
            ),
            name=f"detect-{self.node_id}",
            daemon=True,
        )
        self._detect_process.start()
        logger.info(
            "Detection subprocess started for node %s (pid=%d)",
            self.node_id, self._detect_process.pid,
        )

    def stop(self):
        self._stop_thread_event.set()
        if self._stop_process_event is not None:
            self._stop_process_event.set()

        if self._stream_thread is not None:
            self._stream_thread.join(timeout=10)
            self._stream_thread = None

        if self._detect_process is not None:
            self._detect_process.join(timeout=10)
            if self._detect_process.is_alive():
                self._detect_process.kill()
            self._detect_process = None

        if self._shm is not None:
            self._shm.close()
            self._shm.unlink()
            self._shm = None

        if self._detection_queue is not None:
            self._detection_queue.close()
            self._detection_queue = None

    @property
    def is_alive(self) -> bool:
        stream_ok = self._stream_thread is not None and self._stream_thread.is_alive()
        detect_ok = self._detect_process is not None and self._detect_process.is_alive()
        return stream_ok and detect_ok

    # ── helpers ───────────────────────────────────────────────────

    def _drain_detections(self):
        """Pull all pending detections from the queue, keep the latest."""
        if self._detection_queue is None:
            return
        latest = None
        try:
            while True:
                latest = self._detection_queue.get_nowait()
        except (queue.Empty, OSError):
            pass
        if latest is not None:
            self._detections = latest

    def _write_frame_to_shm(self, frame: np.ndarray):
        """Copy the current frame into shared memory for the detector."""
        if self._shm is not None:
            shm_buf = np.ndarray(frame.shape, dtype=frame.dtype, buffer=self._shm.buf)
            np.copyto(shm_buf, frame)

    # ── Stream loop (high fps) ───────────────────────────────────

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

            self._start_detection_process(consumer.width, consumer.height)

            annotated_url = _build_annotated_url(self.node_id)
            self.node_store.set_annotated_stream_url(self.node_id, annotated_url)
            logger.info(
                "Pipeline running for node %s -> %s (stream %gfps, detect %gfps)",
                self.node_id, annotated_url, self.stream_fps, self.detect_fps,
            )

            while not self._stop_thread_event.is_set():
                loop_start = time.monotonic()

                ok, frame = consumer.read_frame()
                if not ok:
                    logger.warning("Lost stream for node %s, retrying...", self.node_id)
                    consumer.release()
                    time.sleep(RETRY_OPEN_DELAY)
                    if self._stop_thread_event.is_set():
                        break
                    if not consumer.open():
                        logger.error("Retry failed for node %s, worker exiting", self.node_id)
                        break
                    continue

                self._write_frame_to_shm(frame)
                self._drain_detections()

                annotated = PersonDetector.annotate(frame, self._detections)

                try:
                    producer.write_frame(annotated)
                except RuntimeError:
                    logger.error("Producer died for node %s, worker exiting", self.node_id)
                    break

                elapsed = time.monotonic() - loop_start
                sleep_time = consumer.frame_interval - elapsed
                if sleep_time > 0:
                    self._stop_thread_event.wait(sleep_time)

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
    """Coordinates detection pipelines across all online camera nodes."""

    def __init__(self, node_store, person_store, activity_store, detector: PersonDetector):
        self.node_store = node_store
        self.person_store = person_store
        self.activity_store = activity_store
        self.detector = detector
        self._model_size = os.getenv("YOLO_MODEL", "yolov8n")
        self._workers: dict[str, _CameraWorker] = {}
        self._lock = threading.Lock()

        from cv.gallery import GallerySharedMemory
        self._gallery_lock = multiprocessing.Lock()
        self._gallery_shm = GallerySharedMemory(
            create=True, lock=self._gallery_lock,
        )
        self._load_gallery()

    def _load_gallery(self):
        """Read the person gallery from DB and write it into shared memory."""
        ids, names, matrix, face_matrix = self.person_store.get_all_embeddings()
        self._gallery_shm.write(ids, names, matrix, face_matrix)
        logger.info("Gallery loaded: %d persons", len(ids))

    def refresh_gallery(self):
        """Reload the gallery from DB into shared memory.

        Called from routes after a person is registered or deleted so that
        running detection workers pick up the change on their next cycle.
        """
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
                    model_size=self._model_size,
                    node_store=self.node_store,
                    gallery_shm_name=self._gallery_shm.shm_name,
                    gallery_lock=self._gallery_lock,
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
        """Stop pipelines and release the gallery shared memory."""
        self.stop()
        self._gallery_shm.unlink()

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
