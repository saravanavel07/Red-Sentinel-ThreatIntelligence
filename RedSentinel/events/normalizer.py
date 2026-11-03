"""
RedSentinel Event Normalization Module
Transforms heterogeneous cloud, IAM, and host security logs into standardized schema.
"""
from datetime import datetime, timezone
import hashlib
import uuid
from typing import Dict, Any, Optional

STANDARD_EVENT_TYPES = {
    'auth.failure': 'Authentication Failure',
    'auth.success': 'Authentication Success',
    'iam.privilege_escalation': 'Privilege Escalation',
    'iam.role_modified': 'IAM Role Modified',
    'iam.key_created': 'Access Key Created',
    'cloud.security_group_opened': 'Security Group Modified',
    'cloud.storage_public': 'Storage Bucket Public Access',
    'network.suspicious_outbound': 'Suspicious Outbound Traffic',
    'host.file_modified': 'Sensitive File Modified',
    'audit.policy_tamper': 'Audit Policy Tampering',
}

class EventNormalizationError(Exception):
    """Raised when an incoming raw log cannot be normalized."""
    pass

class EventNormalizer:
    """Normalizes raw cloud/host telemetry into the RedSentinel schema."""

    @staticmethod
    def normalize(raw: Dict[str, Any], source_type: str = 'cloudwatch') -> Dict[str, Any]:
        """
        Normalize a raw event dictionary.
        Returns a canonical event structure.
        """
        if not isinstance(raw, dict):
            raise EventNormalizationError("Raw event must be a JSON dictionary.")

        event_id = raw.get('event_id') or str(uuid.uuid4())
        
        # Handle timestamp parsing
        ts = raw.get('timestamp')
        if not ts:
            parsed_time = datetime.now(timezone.utc)
        elif isinstance(ts, (int, float)):
            parsed_time = datetime.fromtimestamp(ts, tz=timezone.utc)
        else:
            try:
                # ISO parsing
                clean_ts = str(ts).replace('Z', '+00:00')
                parsed_time = datetime.fromisoformat(clean_ts)
            except Exception:
                parsed_time = datetime.now(timezone.utc)

        raw_type = str(raw.get('event_type') or raw.get('eventName') or 'unknown').lower()
        mapped_type = raw_type
        for known_key in STANDARD_EVENT_TYPES:
            if known_key in raw_type or raw_type in known_key:
                mapped_type = known_key
                break

        # Standard entity resolution
        account = (
            raw.get('account') 
            or raw.get('userIdentity', {}).get('userName')
            or raw.get('user')
            or raw.get('principalId')
            or 'system'
        )

        host = (
            raw.get('host')
            or raw.get('recipientAccountId')
            or raw.get('instance_id')
            or raw.get('resource_id')
            or 'cloud-control-plane'
        )

        source_ip = (
            raw.get('source_ip')
            or raw.get('sourceIPAddress')
            or raw.get('ip')
            or '127.0.0.1'
        )

        # Baseline severity determination from event type
        severity = raw.get('severity') or 'INFO'
        if severity not in ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']:
            if mapped_type in ['iam.privilege_escalation', 'cloud.security_group_opened']:
                severity = 'HIGH'
            elif mapped_type in ['auth.failure']:
                severity = 'LOW'
            else:
                severity = 'INFO'

        # Generate payload hash for deduplication
        hasher = hashlib.sha256()
        hasher.update(f"{event_id}-{account}-{source_ip}-{mapped_type}".encode('utf-8'))
        dedup_hash = hasher.hexdigest()

        return {
            'event_id': str(event_id),
            'timestamp': parsed_time.isoformat(),
            'event_type': mapped_type,
            'event_type_display': STANDARD_EVENT_TYPES.get(mapped_type, mapped_type),
            'source_type': source_type,
            'source_ip': str(source_ip),
            'account': str(account),
            'host': str(host),
            'severity': severity,
            'raw_event': raw,
            'normalized_event': {
                'account': str(account),
                'source_ip': str(source_ip),
                'host': str(host),
                'action': raw.get('action') or raw.get('eventName') or mapped_type,
                'status': raw.get('status') or raw.get('responseElements', {}).get('status') or 'UNKNOWN',
                'details': raw.get('details', {}),
            },
            'dedup_hash': dedup_hash,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
