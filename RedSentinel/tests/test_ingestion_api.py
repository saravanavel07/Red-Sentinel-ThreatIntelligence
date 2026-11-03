"""
Unit tests for RedSentinel Flask Ingestion Validator & Request Handling
"""
import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ingestion_service.validator import IngestionValidator

class TestIngestionAPI(unittest.TestCase):
    def test_auth_validation_success(self):
        token = "rs_live_secret_token_99b7c841e2a0487d"
        ok, msg = IngestionValidator.validate_auth(f"Bearer {token}")
        self.assertTrue(ok)

    def test_auth_validation_failure(self):
        ok, msg = IngestionValidator.validate_auth("Bearer bad-secret")
        self.assertFalse(ok)
        self.assertIn("Invalid or expired", msg)

    def test_payload_validation_success(self):
        payload = {
            "event_type": "auth.failure",
            "account": "sec-user-1",
            "source_ip": "10.0.0.1"
        }
        ok, msg = IngestionValidator.validate_payload(payload, content_length=150)
        self.assertTrue(ok)

    def test_payload_validation_missing_type(self):
        payload = {"account": "sec-user-1"}
        ok, msg = IngestionValidator.validate_payload(payload, content_length=150)
        self.assertFalse(ok)
        self.assertIn("missing mandatory field", msg)

    def test_payload_size_limit(self):
        payload = {"event_type": "auth.failure"}
        oversized = 600 * 1024 # 600KB exceeds 512KB
        ok, msg = IngestionValidator.validate_payload(payload, content_length=oversized)
        self.assertFalse(ok)
        self.assertIn("exceeds maximum allowed limit", msg)

if __name__ == '__main__':
    unittest.main()
