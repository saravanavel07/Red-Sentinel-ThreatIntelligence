"""
Unit tests for RedSentinel Event Normalizer
"""
import unittest
import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from events.normalizer import EventNormalizer, EventNormalizationError

class TestEventNormalizer(unittest.TestCase):
    def test_normalize_valid_event(self):
        raw = {
            "eventName": "ConsoleLogin",
            "sourceIPAddress": "198.51.100.44",
            "userIdentity": {"userName": "alice@corp.internal"},
            "timestamp": "2026-11-02T19:40:12Z"
        }
        normalized = EventNormalizer.normalize(raw, source_type="aws-cloudtrail")
        self.assertEqual(normalized['account'], "alice@corp.internal")
        self.assertEqual(normalized['source_ip'], "198.51.100.44")
        self.assertTrue(normalized['event_id'])
        self.assertTrue(normalized['dedup_hash'])

    def test_normalize_invalid_input_type(self):
        with self.assertRaises(EventNormalizationError):
            EventNormalizer.normalize("invalid-string-payload") # type: ignore

    def test_normalize_empty_raw(self):
        normalized = EventNormalizer.normalize({})
        self.assertEqual(normalized['account'], "system")
        self.assertEqual(normalized['source_ip'], "127.0.0.1")

if __name__ == '__main__':
    unittest.main()
