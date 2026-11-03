# RedSentinel Defensive Security & Privacy Safeguards

## Core Principles
RedSentinel is built exclusively as an authorized defensive monitoring, detection, and investigation platform.

### Safeguards Implemented
1. **Synthetic Telemetry Baseline**: Default installation utilizes synthetic event logs simulating cloud events. No live unauthorized network scanning or credential sniffing is performed.
2. **Credential Protection**: Plaintext passwords and API secrets are never logged or stored. Ingestion pipelines strip raw authorization credentials before database storage.
3. **Payload Inspection & Limits**: The Flask ingestion microservice enforces an absolute 512 KB request size limit to prevent buffer exhaustion and denial of service.
4. **Token Authentication**: All ingestion traffic requires `Authorization: Bearer <INGESTION_API_KEY>`.
5. **Anti-Prompt-Injection**: The LangGraph workflow treats all log fields as untrusted raw input. Log content is passed in explicit structured metadata fields rather than direct instruction prompts.
6. **No Autonomous Destructive Execution**: Defensive recommendations (e.g. session revocation, IP blocking) are presented for **Human Analyst Approval** at Node 8. No destructive action runs autonomously without analyst signoff.
7. **Tamper-Evident Audit Logging**: Every incident acknowledgement, state transition, and analyst comment generates an append-only `AuditLog` entry.
