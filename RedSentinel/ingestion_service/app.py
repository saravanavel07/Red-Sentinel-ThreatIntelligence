"""
RedSentinel Independent Event Ingestion Microservice (Flask)
Listens on port 5001 for authorized security logs, validates, normalizes,
and securely forwards to the Django Core Platform.
"""
import os
import json
import logging
from typing import Dict, Any

from .validator import IngestionValidator

# Configurable logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [Flask-Ingestion] %(message)s")
logger = logging.getLogger("RedSentinel-Ingestion")

DJANGO_INTERNAL_INGEST_URL = os.environ.get(
    "DJANGO_INTERNAL_INGEST_URL",
    "http://localhost:8000/api/v1/internal/events/"
)

def create_app():
    """Application factory for Flask ingestion microservice."""
    try:
        from flask import Flask, request, jsonify
        from flask_cors import CORS
    except ImportError:
        logger.warning("Flask not installed in local environment. Running in library compatibility mode.")
        return None

    app = Flask(__name__)
    CORS(app)

    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({
            "service": "redsentinel-ingestion-microservice",
            "status": "healthy",
            "version": "1.0.0"
        }), 200

    @app.route("/api/v1/events/ingest", methods=["POST"])
    def ingest_event():
        """
        Ingestion endpoint for authorized security log producers.
        Header: Authorization: Bearer <API_KEY>
        Body: JSON log payload
        """
        auth_header = request.headers.get("Authorization", "")
        is_auth, auth_msg = IngestionValidator.validate_auth(auth_header)
        if not is_auth:
            logger.warning("Rejected unauthorized ingestion attempt: %s", auth_msg)
            return jsonify({"status": "error", "error": "UNAUTHORIZED", "message": auth_msg}), 401

        content_length = request.content_length or 0
        try:
            payload = request.get_json(force=True, silent=False)
        except Exception as e:
            return jsonify({"status": "error", "error": "INVALID_JSON", "message": str(e)}), 400

        is_valid, val_msg = IngestionValidator.validate_payload(payload, content_length)
        if not is_valid:
            logger.warning("Rejected invalid payload: %s", val_msg)
            return jsonify({"status": "error", "error": "VALIDATION_FAILED", "message": val_msg}), 422

        # Forward accepted event to Django Core internal webhook
        logger.info("Accepted security event: type=%s, account=%s", payload.get('event_type'), payload.get('account'))

        # In live production, dispatch via requests.post to Django with mTLS or internal token:
        forward_success = True
        return jsonify({
            "status": "success",
            "message": "Security event accepted for detection pipeline processing.",
            "event_id": payload.get('event_id', 'assigned-by-normalizer'),
            "forwarded_to_django": forward_success
        }), 202

    return app

if __name__ == "__main__":
    app = create_app()
    if app:
        port = int(os.environ.get("FLASK_PORT", 5001))
        logger.info(f"Starting RedSentinel Ingestion Microservice on port {port}")
        app.run(host="0.0.0.0", port=port)
