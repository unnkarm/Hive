from flask import Flask
from flask_cors import CORS
import logging
import os
import shutil

from database import NodeStore, PersonStore, ActivityStore
from cv.detector import PersonDetector
from cv.reid import ReIdEmbedder
from pipeline_manager import PipelineManager
from stream.producer import HLS_ROOT

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logging.getLogger('werkzeug').setLevel(logging.WARNING)
logger = logging.getLogger(__name__)


def _purge_stale_hls():
    """Remove leftover HLS segments from a previous run."""
    if os.path.isdir(HLS_ROOT):
        shutil.rmtree(HLS_ROOT, ignore_errors=True)
        logger.info("Purged stale HLS directory: %s", HLS_ROOT)


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.node_store = NodeStore()
    app.camera_store = app.node_store

    app.node_store.reset_stale_runtime_state()
    _purge_stale_hls()

    app.person_store = PersonStore()
    app.activity_store = ActivityStore()

    detector = PersonDetector()
    app.detector = detector
    app.reid_embedder = ReIdEmbedder()
    
    from cv.face_detector import FaceDetector
    app.face_detector = FaceDetector()

    app.pipeline_manager = PipelineManager(
        node_store=app.node_store,
        person_store=app.person_store,
        activity_store=app.activity_store,
        detector=detector,
    )
    logger.info("Backend initialized (RTSP metadata service + detection pipeline + re-ID, Mongo-backed)")

    import routes
    routes.register_routes(app)

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv("VIDEO_STREAM_PORT", "5000"))
    app.run(debug=True, host='0.0.0.0', port=port)
