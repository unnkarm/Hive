import json
import logging
import os
import subprocess
import time
from pathlib import Path
from typing import Optional

import cv2
import requests
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("CameraNode")


class CameraNode:
    """Capture frames and publish RTSP while reporting node state to backend."""

    def __init__(
        self,
        backend_url: str,
        node_name: str,
        camera_source=0,
        frame_rate: int = 10,
        frame_width: int = 1280,
        frame_height: int = 720,
        rtsp_url: Optional[str] = None,
        stream_url: Optional[str] = None,
        heartbeat_interval: int = 5,
        enrollment_token: Optional[str] = None,
        node_id: Optional[str] = None,
        node_secret: Optional[str] = None,
        credentials_path: Optional[str] = None,
    ):
        self.backend_url = backend_url.rstrip("/")
        self.node_name = node_name.strip()
        self.camera_source = camera_source
        self.frame_rate = max(1, min(int(frame_rate), 60))
        self.frame_interval = 1.0 / self.frame_rate
        self.frame_width = int(frame_width)
        self.frame_height = int(frame_height)
        self.heartbeat_interval = max(1, int(heartbeat_interval))
        self.enrollment_token = enrollment_token

        self.credentials_path = (
            Path(credentials_path)
            if credentials_path
            else Path(__file__).resolve().parent / ".node_credentials.json"
        )
        self.node_id = node_id
        self.node_secret = node_secret
        self._load_credentials_from_disk()

        self.rtsp_url = rtsp_url
        self.stream_url = stream_url
        self.ffmpeg_process: Optional[subprocess.Popen] = None

        self.cap = cv2.VideoCapture(camera_source)
        if not self.cap.isOpened():
            raise RuntimeError(f"Failed to open camera source: {camera_source}")
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.frame_width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.frame_height)
        self.cap.set(cv2.CAP_PROP_FPS, self.frame_rate)
        self.frame_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or self.frame_width
        self.frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or self.frame_height

    def _load_credentials_from_disk(self) -> None:
        if self.node_id and self.node_secret:
            return
        if not self.credentials_path.exists():
            return
        try:
            payload = json.loads(self.credentials_path.read_text(encoding="utf-8"))
            self.node_id = self.node_id or payload.get("node_id")
            self.node_secret = self.node_secret or payload.get("node_secret")
        except Exception as exc:
            logger.warning("Could not load credentials file %s: %s", self.credentials_path, exc)

    def _save_credentials_to_disk(self) -> None:
        if not self.node_id or not self.node_secret:
            return
        payload = {
            "node_id": self.node_id,
            "node_secret": self.node_secret,
            "node_name": self.node_name,
        }
        self.credentials_path.parent.mkdir(parents=True, exist_ok=True)
        self.credentials_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _post_json(self, path: str, payload: dict, headers: Optional[dict] = None):
        try:
            return requests.post(
                f"{self.backend_url}{path}",
                json=payload,
                headers=headers or {},
                timeout=8,
            )
        except requests.RequestException as exc:
            logger.warning("POST %s failed: %s", path, exc)
            return None

    def _auth_headers(self) -> dict:
        return {
            "X-Node-Id": self.node_id or "",
            "X-Node-Secret": self.node_secret or "",
        }

    def _enroll_if_needed(self) -> bool:
        if self.node_id and self.node_secret:
            return True
        
        # Retry enrollment 6 times with 2-second delays (backend startup can take time)
        for attempt in range(1, 7):
            response = self._post_json(
                "/api/nodes/enroll",
                {
                    "node_name": self.node_name,
                    "stream_url": self.stream_url,
                    "rtsp_url": self.rtsp_url,
                    "enrollment_token": self.enrollment_token,
                },
            )
            if response is not None and response.status_code < 400:
                body = response.json()
                node = body.get("node") or {}
                self.node_id = node.get("node_id")
                self.node_secret = body.get("node_secret")
                if self.node_id and self.node_secret:
                    self._save_credentials_to_disk()
                    logger.info(f"Node enrolled successfully (attempt {attempt})")
                    return True
            
            if attempt < 6:
                logger.info(f"Enrollment attempt {attempt}/6 failed. Retrying in 2s...")
                time.sleep(2)
        
        logger.error("Failed to enroll node after 6 attempts")
        return False

    def _connect(self) -> bool:
        response = self._post_json(
            "/api/nodes/connect",
            {"stream_url": self.stream_url, "rtsp_url": self.rtsp_url},
            headers=self._auth_headers(),
        )
        return response is not None and response.status_code < 400

    def _heartbeat(self) -> bool:
        response = self._post_json(
            "/api/nodes/heartbeat",
            {"stream_url": self.stream_url, "rtsp_url": self.rtsp_url},
            headers=self._auth_headers(),
        )
        return response is not None and response.status_code < 400

    def _disconnect(self) -> bool:
        response = self._post_json("/api/nodes/disconnect", {}, headers=self._auth_headers())
        return response is not None and response.status_code < 400

    def _start_ffmpeg(self) -> None:
        if not self.node_id:
            raise RuntimeError("node_id must be available before ffmpeg start")
        if not self.rtsp_url:
            self.rtsp_url = f"rtsp://localhost:8554/{self.node_id}"
        if not self.stream_url:
            self.stream_url = self.rtsp_url

        self.ffmpeg_process = subprocess.Popen(
            [
                "ffmpeg",
                "-loglevel",
                "warning",
                "-f",
                "rawvideo",
                "-pix_fmt",
                "bgr24",
                "-s",
                f"{self.frame_width}x{self.frame_height}",
                "-r",
                str(self.frame_rate),
                "-i",
                "pipe:0",
                "-an",
                "-c:v",
                "libx264",
                "-profile:v",
                "baseline",
                "-preset",
                "ultrafast",
                "-tune",
                "zerolatency",
                "-g",
                str(self.frame_rate),
                "-pix_fmt",
                "yuv420p",
                "-b:v",
                "1500k",  # Set bitrate for lower buffering
                "-f",
                "rtsp",
                "-rtsp_transport",
                "tcp",
                self.rtsp_url,
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=None,  # Output stderr to terminal for debugging
            bufsize=1,  # Line-buffered
        )

    def stream_video(self) -> None:
        if not self.node_name:
            raise RuntimeError("NODE_NAME is required")
        if not self._enroll_if_needed():
            raise RuntimeError("Failed to enroll node")
        self._start_ffmpeg()
        time.sleep(1.0) # Give MediaMTX time to register the path
        self._connect()

        next_heartbeat_at = 0.0
        try:
            while True:
                loop_start = time.monotonic()
                ret, frame = self.cap.read()
                if not ret:
                    time.sleep(0.2)
                    continue

                # Flip frame horizontally (mirror effect)
                frame = cv2.flip(frame, 1)

                if frame.shape[:2] != (self.frame_height, self.frame_width):
                    frame = cv2.resize(frame, (self.frame_width, self.frame_height))

                if not self.ffmpeg_process or self.ffmpeg_process.poll() is not None:
                    raise RuntimeError("FFmpeg process is not running")
                self.ffmpeg_process.stdin.write(frame.tobytes())
                self.ffmpeg_process.stdin.flush()  # Flush immediately for lower latency

                now = time.monotonic()
                if now >= next_heartbeat_at:
                    self._heartbeat()
                    next_heartbeat_at = now + self.heartbeat_interval

                sleep_time = self.frame_interval - (time.monotonic() - loop_start)
                if sleep_time > 0:
                    time.sleep(sleep_time)
        except KeyboardInterrupt:
            pass
        finally:
            self.cleanup()

    def cleanup(self) -> None:
        if self.cap:
            self.cap.release()
        if self.ffmpeg_process:
            try:
                if self.ffmpeg_process.stdin:
                    self.ffmpeg_process.stdin.close()
                self.ffmpeg_process.terminate()
                self.ffmpeg_process.wait(timeout=3)
            except Exception:
                self.ffmpeg_process.kill()
            finally:
                self.ffmpeg_process = None
        if self.node_id and self.node_secret:
            self._disconnect()


def main():
    load_dotenv()
    node_name = os.getenv("NODE_NAME", os.getenv("CAMERA_NODE_ID", "camera-node-1"))
    backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")
    camera_source_raw = os.getenv("CAMERA_SOURCE", "0")
    camera_source = int(camera_source_raw) if camera_source_raw.isdigit() else camera_source_raw

    hls_base_url = os.getenv("HLS_BASE_URL", "").rstrip("/")
    preset_node_id = os.getenv("NODE_ID", "")
    stream_url = os.getenv("STREAM_URL", "")
    if not stream_url and hls_base_url:
        stream_url = f"{hls_base_url}/{preset_node_id or node_name}/index.m3u8"

    camera = CameraNode(
        backend_url=backend_url,
        node_name=node_name,
        camera_source=camera_source,
        frame_rate=int(os.getenv("CAMERA_FPS", "10")),
        frame_width=int(os.getenv("CAMERA_WIDTH", "1280")),
        frame_height=int(os.getenv("CAMERA_HEIGHT", "720")),
        rtsp_url=os.getenv("RTSP_URL") or None,
        stream_url=stream_url or None,
        heartbeat_interval=int(os.getenv("CAMERA_HEARTBEAT_INTERVAL", "5")),
        enrollment_token=os.getenv("NODE_ENROLLMENT_TOKEN") or None,
        node_id=os.getenv("NODE_ID") or None,
        node_secret=os.getenv("NODE_SECRET") or None,
        credentials_path=os.getenv("NODE_CREDENTIALS_PATH", ".node_credentials.json"),
    )
    camera.stream_video()


if __name__ == "__main__":
    main()
