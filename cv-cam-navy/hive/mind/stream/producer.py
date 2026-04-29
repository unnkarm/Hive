"""Writes annotated frames to an HLS stream via an FFmpeg subprocess."""

import logging
import os
import shutil
import subprocess

import numpy as np

logger = logging.getLogger(__name__)

HLS_ROOT = os.getenv("HLS_OUTPUT_ROOT", "/tmp/hivemind_streams")


class StreamProducer:
    """Spawns FFmpeg to encode raw frames into rolling HLS segments on disk."""

    def __init__(
        self,
        node_id: str,
        width: int,
        height: int,
        fps: float = 2.0,
    ):
        self.node_id = node_id
        self.width = width
        self.height = height
        self.fps = fps
        self.output_dir = os.path.join(HLS_ROOT, node_id)
        self._process: subprocess.Popen | None = None

    @property
    def playlist_path(self) -> str:
        return os.path.join(self.output_dir, "index.m3u8")

    def start(self):
        """Create output directory and spawn the FFmpeg encoder."""
        os.makedirs(self.output_dir, exist_ok=True)

        cmd = [
            "ffmpeg",
            "-loglevel", "warning",
            # input: raw BGR frames piped via stdin
            "-f", "rawvideo",
            "-pix_fmt", "bgr24",
            "-s", f"{self.width}x{self.height}",
            "-r", str(self.fps),
            "-i", "pipe:0",
            # no audio
            "-an",
            # encode
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "zerolatency",
            "-g", str(max(int(self.fps), 1)),
            "-sc_threshold", "0",
            "-pix_fmt", "yuv420p",
            # HLS output
            "-f", "hls",
            "-hls_time", "1",
            "-hls_list_size", "5",
            "-hls_flags", "delete_segments+append_list+temp_file",
            "-hls_segment_filename", os.path.join(self.output_dir, "seg_%03d.ts"),
            self.playlist_path,
        ]

        logger.info("Starting HLS producer for node %s: %dx%d @ %.1f fps", self.node_id, self.width, self.height, self.fps)
        self._process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )

    def write_frame(self, frame: np.ndarray):
        """Write a single BGR frame to the FFmpeg pipe."""
        if self._process is None or self._process.poll() is not None:
            raise RuntimeError(f"FFmpeg process not running for node {self.node_id}")
        try:
            self._process.stdin.write(frame.tobytes())
            self._process.stdin.flush()
        except BrokenPipeError:
            stderr = self._process.stderr.read().decode(errors="replace") if self._process.stderr else ""
            logger.error("FFmpeg pipe broken for node %s: %s", self.node_id, stderr)
            raise

    def stop(self):
        """Gracefully shut down FFmpeg and clean up HLS segments."""
        if self._process is not None:
            try:
                if self._process.stdin:
                    self._process.stdin.close()
                self._process.terminate()
                self._process.wait(timeout=5)
            except Exception:
                self._process.kill()
            finally:
                self._process = None

        if os.path.isdir(self.output_dir):
            shutil.rmtree(self.output_dir, ignore_errors=True)

        logger.info("HLS producer stopped for node %s", self.node_id)

    @property
    def is_running(self) -> bool:
        return self._process is not None and self._process.poll() is None
