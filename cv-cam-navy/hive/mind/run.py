#!/usr/bin/env python
import atexit
import os
import signal
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

if __name__ == '__main__':
    app = create_app()

    def _shutdown(*_args):
        print("\nShutting down...")
        app.pipeline_manager.stop()
        app.node_store.reset_stale_runtime_state()

    atexit.register(_shutdown)
    signal.signal(signal.SIGINT, lambda *a: sys.exit(0))
    signal.signal(signal.SIGTERM, lambda *a: sys.exit(0))

    port = int(os.getenv('VIDEO_STREAM_PORT', 5000))
    from werkzeug.serving import run_simple

    print(f"Starting HiveMind Surveillance Backend on port {port}...")
    run_simple(
        '0.0.0.0',
        port,
        app,
        use_debugger=os.getenv('FLASK_DEBUG', '0') == '1',
        use_reloader=False,
        threaded=True
    )
