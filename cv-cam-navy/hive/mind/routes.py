import base64
import logging
import os

import cv2
import numpy as np
from flask import jsonify, request, send_from_directory

from database import NodeAlreadyExistsError, NodeAuthError, now_ist
from stream.producer import HLS_ROOT

logger = logging.getLogger(__name__)


def register_routes(app):
    """Register API routes for node enrollment/lifecycle and discovery."""

    enrollment_token = os.getenv("NODE_ENROLLMENT_TOKEN", "").strip()

    def _read_payload():
        return request.get_json(silent=True) or {}

    def _auth_from_headers():
        node_id = request.headers.get("X-Node-Id", "").strip()
        node_secret = request.headers.get("X-Node-Secret", "").strip()
        if not node_id or not node_secret:
            return None, (jsonify({"error": "Missing X-Node-Id or X-Node-Secret"}), 401)
        try:
            app.node_store.authenticate_node(node_id=node_id, node_secret=node_secret)
            return node_id, None
        except NodeAuthError as exc:
            return None, (jsonify({"error": str(exc)}), 401)

    @app.route('/api/nodes', methods=['GET'])
    def get_nodes():
        """List all nodes."""
        try:
            nodes = app.node_store.get_all()
            return jsonify({'nodes': nodes}), 200
        except Exception as e:
            logger.error(f"Error fetching nodes: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/nodes/<node_id>', methods=['GET'])
    def get_node(node_id):
        """Get one node by node_id."""
        try:
            node = app.node_store.get(node_id)
            if node is None:
                return jsonify({'error': 'Node not found'}), 404
            return jsonify({'node': node}), 200
        except Exception as e:
            logger.error(f"Error fetching node {node_id}: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/nodes/enroll', methods=['POST'])
    def enroll_node():
        """One-time enrollment endpoint: returns node_id + node_secret."""
        try:
            payload = _read_payload()
            provided_token = (payload.get("enrollment_token") or "").strip()
            if enrollment_token and provided_token != enrollment_token:
                return jsonify({'error': 'Invalid enrollment token'}), 403

            node_name = (payload.get('node_name') or "").strip()
            if not node_name:
                return jsonify({'error': 'node_name is required'}), 400

            node, node_secret = app.node_store.enroll_node(
                node_name=node_name,
                stream_url=payload.get("stream_url"),
                rtsp_url=payload.get("rtsp_url"),
            )
            return jsonify({'node': node, 'node_secret': node_secret}), 201
        except NodeAlreadyExistsError as e:
            return jsonify({'error': str(e)}), 409
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            logger.error(f"Error in /api/nodes/enroll: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/nodes/connect', methods=['POST'])
    def connect_node():
        """Mark node online (authenticated)."""
        node_id, auth_error = _auth_from_headers()
        if auth_error:
            return auth_error
        try:
            payload = _read_payload()
            app.node_store.connect_node(
                node_id=node_id,
                stream_url=payload.get("stream_url"),
                rtsp_url=payload.get("rtsp_url"),
            )
            # Automatically start the detection pipeline for this newly connected node
            app.pipeline_manager.start()
            
            node = app.node_store.get(node_id)
            return jsonify({'ok': True, 'node': node}), 200
        except Exception as e:
            logger.error(f"Error in /api/nodes/connect: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/nodes/heartbeat', methods=['POST'])
    def heartbeat_node():
        """Refresh node liveness (authenticated)."""
        node_id, auth_error = _auth_from_headers()
        if auth_error:
            return auth_error
        try:
            payload = _read_payload()
            app.node_store.heartbeat_node(
                node_id=node_id,
                stream_url=payload.get("stream_url"),
                rtsp_url=payload.get("rtsp_url"),
            )
            return jsonify({'ok': True}), 200
        except Exception as e:
            logger.error(f"Error in /api/nodes/heartbeat: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/nodes/disconnect', methods=['POST'])
    def disconnect_node():
        """Mark node offline (authenticated)."""
        node_id, auth_error = _auth_from_headers()
        if auth_error:
            return auth_error
        try:
            app.node_store.disconnect_node(node_id=node_id)
            return jsonify({'ok': True}), 200
        except Exception as e:
            logger.error(f"Error in /api/nodes/disconnect: {e}")
            return jsonify({'error': str(e)}), 500

    # Compatibility route while transitioning frontend/camera-node.
    @app.route('/api/cameras', methods=['GET'])
    def get_cameras_compat():
        try:
            nodes = app.node_store.get_all()
            return jsonify({'cameras': nodes, 'nodes': nodes}), 200
        except Exception as e:
            logger.error(f"Error fetching cameras: {e}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'timestamp': now_ist().isoformat()
        }), 200

    # ── Pipeline control ──────────────────────────────────────────────

    @app.route('/api/pipeline/start', methods=['POST'])
    def pipeline_start():
        """Start detection pipelines for all online camera nodes."""
        try:
            app.pipeline_manager.start()
            return jsonify({'ok': True, 'status': app.pipeline_manager.get_status()}), 200
        except Exception as e:
            logger.error("Error starting pipeline: %s", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/api/pipeline/stop', methods=['POST'])
    def pipeline_stop():
        """Stop all detection pipelines."""
        try:
            app.pipeline_manager.stop()
            return jsonify({'ok': True}), 200
        except Exception as e:
            logger.error("Error stopping pipeline: %s", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/api/pipeline/status', methods=['GET'])
    def pipeline_status():
        """Get current pipeline status."""
        try:
            return jsonify(app.pipeline_manager.get_status()), 200
        except Exception as e:
            logger.error("Error getting pipeline status: %s", e)
            return jsonify({'error': str(e)}), 500

    # ── Person registration (re-ID gallery) ────────────────────────────

    @app.route('/api/persons/register', methods=['POST'])
    def register_person():
        """Register a person from a webcam capture for re-ID."""
        try:
            payload = _read_payload()
            name = (payload.get("name") or "").strip()
            image_b64 = (payload.get("image_b64") or "").strip()

            if not name:
                return jsonify({"error": "name is required"}), 400
            if not image_b64:
                return jsonify({"error": "image_b64 is required"}), 400

            img_bytes = base64.b64decode(image_b64)
            arr = np.frombuffer(img_bytes, dtype=np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if frame is None:
                return jsonify({"error": "Could not decode image"}), 400

            detections = app.detector.detect(frame)
            if not detections:
                return jsonify({"error": "No person detected in the image"}), 400

            x1, y1, x2, y2, _conf, _cls = max(
                detections, key=lambda d: (d[2] - d[0]) * (d[3] - d[1]),
            )
            crop = frame[y1:y2, x1:x2]
            face_crop = crop[: max(1, int(crop.shape[0] * 0.45)), :]

            embedding = app.reid_embedder.extract(crop)
            
            face_embedding = None
            face_results = app.face_detector.detect(face_crop)
            if not face_results:
                face_results = app.face_detector.detect(crop)
            if face_results:
                face_embedding = face_results[0]['embedding']

            person = app.person_store.register_person(name, embedding, face_embedding)
            app.pipeline_manager.refresh_gallery()
            return jsonify({"person": person}), 201

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.error("Error in /api/persons/register: %s", e)
            return jsonify({"error": str(e)}), 500

    @app.route('/api/persons', methods=['GET'])
    def get_persons():
        """List all registered persons."""
        try:
            persons = app.person_store.get_all_persons()
            return jsonify({"persons": persons}), 200
        except Exception as e:
            logger.error("Error fetching persons: %s", e)
            return jsonify({"error": str(e)}), 500

    @app.route('/api/persons/<person_id>', methods=['DELETE'])
    def delete_person(person_id):
        """Remove a registered person."""
        try:
            deleted = app.person_store.delete_person(person_id)
            if not deleted:
                return jsonify({"error": "Person not found"}), 404
            app.pipeline_manager.refresh_gallery()
            return jsonify({"ok": True}), 200
        except Exception as e:
            logger.error("Error deleting person %s: %s", person_id, e)
            return jsonify({"error": str(e)}), 500

    @app.route('/api/persons/<person_id>/activities', methods=['GET'])
    def get_person_activities(person_id):
        """Retrieve activity history for a specific person."""
        try:
            limit = request.args.get("limit", 50, type=int)
            activities = app.activity_store.get_person_activity(person_id, limit=limit)
            return jsonify({"activities": activities}), 200
        except Exception as e:
            logger.error("Error fetching activities for %s: %s", person_id, e)
            return jsonify({"error": str(e)}), 500

    @app.route('/api/activities/latest', methods=['GET'])
    def get_latest_activities():
        """Retrieve most recent activities across all persons."""
        try:
            limit = request.args.get("limit", 20, type=int)
            docs = app.activity_store.collection.find().sort("timestamp", -1).limit(limit)
            activities = [app.activity_store._serialize(d) for d in docs]
            return jsonify({"activities": activities}), 200
        except Exception as e:
            logger.error("Error fetching latest activities: %s", e)
            return jsonify({"error": str(e)}), 500

    @app.route('/api/activities/summary', methods=['GET'])
    def get_activity_summary():
        """Retrieve total duration per person per activity for today."""
        try:
            summary = app.activity_store.get_global_activity_summary()
            return jsonify({"summary": summary}), 200
        except Exception as e:
            logger.error("Error fetching activity summary: %s", e)
            return jsonify({"error": str(e)}), 500

    # ── Annotated HLS stream serving ─────────────────────────────────

    @app.route('/streams/<node_id>/<filename>')
    def serve_hls(node_id, filename):
        """Serve HLS playlist and segment files for an annotated stream."""
        directory = os.path.join(HLS_ROOT, node_id)
        if not os.path.isdir(directory):
            return jsonify({'error': 'Stream not found'}), 404

        mimetype = None
        if filename.endswith('.m3u8'):
            mimetype = 'application/vnd.apple.mpegurl'
        elif filename.endswith('.ts'):
            mimetype = 'video/mp2t'

        response = send_from_directory(directory, filename, mimetype=mimetype)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    logger.info("All routes registered")
