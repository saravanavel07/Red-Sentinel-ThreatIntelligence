# RedSentinel Database Schema Documentation

## Entity Relationship Overview

The RedSentinel database relies on Django ORM with SQLite (development/demonstration) or PostgreSQL (production).

### Models

1. **`UserProfile`**
   - `user`: Foreign key to `django.contrib.auth.models.User`
   - `role`: Enum (`SOC_ANALYST`, `INCIDENT_RESPONDER`, `SECOPS_LEAD`, `SECURITY_ADMIN`)
   - `created_at`: DateTime

2. **`SecurityEvent`**
   - `event_id`: CharField(64) - Primary Key
   - `timestamp`: DateTimeField with DB index
   - `event_type`: CharField(128) - Indexed (e.g., `auth.failure`, `iam.privilege_escalation`)
   - `source`: CharField(64)
   - `source_ip`: CharField(45) - Indexed IPv4/IPv6
   - `host`: CharField(128) - Indexed target host or cloud ARN
   - `account`: CharField(128) - Indexed user identity
   - `severity`: CharField(20) - Enum: `INFORMATIONAL`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
   - `raw_event`: JSONField storing the unmodified ingestion payload
   - `normalized_event`: JSONField storing standardized attributes
   - `dedup_hash`: CharField(64) - Unique SHA-256 deduplication key

3. **`DetectionRuleModel`**
   - `rule_id`: CharField(32) - Primary Key (`RS-AUTH-001`, `RS-AUTH-002`, etc.)
   - `name`: CharField(128)
   - `description`: TextField
   - `severity`: CharField(20)
   - `threshold`: IntegerField
   - `enabled`: BooleanField
   - `mitre_attack_id`: CharField(32)

4. **`SecurityAlert`**
   - `alert_id`: CharField(64) - Primary Key
   - `title`: CharField(256)
   - `description`: TextField
   - `rule_id`: CharField(32)
   - `risk_score`: IntegerField (0–100)
   - `severity`: CharField(20)
   - `confidence`: FloatField (0.00–1.00)
   - `evidence`: JSONField containing triggering telemetry pointers

5. **`Incident`**
   - `incident_id`: CharField(64) - Primary Key (`INC-YYYYMMDD-XXXXXX`)
   - `title`: CharField(256)
   - `description`: TextField
   - `severity`: CharField(20)
   - `risk_score`: IntegerField (0–100)
   - `status`: CharField(32) - Enum: `OPEN`, `INVESTIGATING`, `CONTAINED`, `RESOLVED`, `FALSE_POSITIVE`
   - `primary_account`: CharField(128)
   - `primary_host`: CharField(128)
   - `ai_triage_report`: JSONField containing LangGraph synthesis

6. **`AnalystNote`**
   - `incident`: ForeignKey to `Incident`
   - `author`: CharField(128)
   - `content`: TextField
   - `action_taken`: CharField(128)
   - `created_at`: DateTimeField

7. **`AuditLog`**
   - `user`: CharField(128)
   - `action`: CharField(128) (e.g., `ACKNOWLEDGE_INCIDENT`, `CONTAIN_ASSET`, `OVERRIDE_SCORE`)
   - `resource_type`: CharField(64)
   - `resource_id`: CharField(128)
   - `details`: JSONField
   - `timestamp`: DateTimeField
