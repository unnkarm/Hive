"""Reads frames from an RTSP/HLS camera stream via a background thread."""

import logging
import os
import threading

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class StreamConsumer:
    """Opens a video stream and continuously grabs the latest frame.

    A dedicated reader thread keeps the OpenCV buffer drained, so the
    caller always gets a fresh frame without variable-latency drain loops.
    """

    def __init__(self, stream_url: str, target_fps: float = 2.0):
        self.stream_url = stream_url
        self.target_fps = max(0.1, target_fps)
        self._frame_interval = 1.0 / self.target_fps
        self._cap: cv2.VideoCapture | None = None
        self.width: int = 0
        self.height: int = 0

        self._latest: np.ndarray | None = None
        self._lock = threading.Lock()
        self._reader_thread: threading.Thread | None = None
        self._stop = threading.Event()

    def open(self) -> bool:
        """Open the stream and start the background reader. Returns True on success."""
        import time
        for i in range(15):
            logger.info("Opening stream (attempt %d/15): %s", i + 1, self.stream_url)
            # Use FFMPEG backend explicitly and set TCP transport for RTSP to be more reliable
            os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"
            self._cap = cv2.VideoCapture(self.stream_url, cv2.CAP_FFMPEG)
            if self._cap.isOpened():
                break
            logger.warning("Failed to open stream on attempt %d, retrying...", i + 1)
            time.sleep(1.0)

        if not self._cap or not self._cap.isOpened():
            logger.error("Failed to open stream after 15 attempts: %s", self.stream_url)
            return False

        self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        self.width = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        logger.info(
            "Stream opened: %s (%dx%d)",
            self.stream_url, self.width, self.height,
        )

        self._stop.clear()
        self._reader_thread = threading.Thread(
            target=self._reader_loop,
            name=f"reader-{self.stream_url}",
            daemon=True,
        )
        self._reader_thread.start()
        return True

    def _reader_loop(self):
        """Continuously grab+decode the newest frame in the background."""
        while not self._stop.is_set():
            if self._cap is None or not self._cap.isOpened():
                break
            ret, frame = self._cap.read()
            with self._lock:
                if ret:
                    self._latest = frame
                else:
                    self._latest = None

    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        """Return the most recent frame captured by the reader thread."""
        import time
        # Wait up to 5 seconds for the first frame to arrive
        for _ in range(50):
            with self._lock:
                if self._latest is not None:
                    return True, self._latest
            if self._reader_thread is None or not self._reader_thread.is_alive():
                break
            time.sleep(0.1)
            
        return False, None

    def release(self):
        """Stop the reader thread and release the underlying capture."""
        self._stop.set()
        if self._reader_thread is not None:
            self._reader_thread.join(timeout=5)
            self._reader_thread = None
        if self._cap is not None:
            self._cap.release()
            self._cap = None
        self._latest = None
        logger.info("Stream released: %s", self.stream_url)

    @property
    def frame_interval(self) -> float:
        """Seconds to wait between frames to hit target FPS."""
        return self._frame_interval
