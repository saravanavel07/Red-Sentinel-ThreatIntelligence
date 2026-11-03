"""
RedSentinel Ingestion Service Input Validator
Enforces request size limits, token authorization, and schema integrity.
"""
from typing import Dict, Any, Tuple
import os

class IngestionValidator:
    """Validates raw event submissions before acceptance."""

    MAX_PAYLOAD_BYTES = 512 * 1024  # 512 KB request limit
    EXPECTED_TOKEN = os.environ.get("INGESTION_API_KEY", "rs_live_secret_token_99b7c841e2a0487d")

    @classmethod
    def validate_auth(cls, auth_header: str) -> Tuple[bool, str]:
        """Verify Bearer or Api-Key token."""
        if not auth_header:
            return False, "Missing Authorization header."
        
        token = auth_header.replace("Bearer ", "").replace("ApiKey ", "").strip()
        if token != cls.EXPECTED_TOKEN:
            return False, "Invalid or expired ingestion API token."
        
        return True, "Authorized"

    @classmethod
    def validate_payload(cls, data: Any, content_length: int = 0) -> Tuple[bool, str]:
        """Validate structure and size limits."""
        if content_length > cls.MAX_PAYLOAD_BYTES:
            return False, f"Payload size exceeds maximum allowed limit ({cls.MAX_PAYLOAD_BYTES} bytes)."

        if not isinstance(data, dict):
            return False, "Event payload must be a JSON object."

        # Required fields check
        has_type = bool(data.get('event_type') or data.get('eventName'))
        if not has_type:
            return False, "Payload missing mandatory field 'event_type' or 'eventName'."

        return True, "Valid payload"
