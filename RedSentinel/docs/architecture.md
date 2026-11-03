# RedSentinel Platform Architecture

## System Overview

RedSentinel operates as a multi-tier threat detection and intelligence platform designed for hybrid cloud and enterprise environments. The platform processes raw security telemetry into actionable incident intelligence through deterministic rules and LangGraph-orchestrated AI triage.

```mermaid
graph TD
    subgraph Sources [Authorized Telemetry Sources]
        AWS[AWS CloudTrail / GuardDuty]
        Host[Linux Auditd / Syslog]
        K8s[Kubernetes Audit Logs]
    end

    subgraph Ingestion [Ingestion Layer - Flask Microservice]
        TokenAuth[Token Authentication & Size Limits]
        Normalizer[Schema Normalization]
    end

    subgraph Core [Detection & Correlation Engine - Django Core]
        Engine[Explainable Detection Engine]
        R1[RS-AUTH-001: Repeated Auth Failures]
        R2[RS-AUTH-002: Suspicious Login Sequence]
        R3[RS-IAM-003: Privilege Change Monitoring]
        R4[RS-TIME-004: Unusual Activity Time]
        R5[RS-VOL-005: Event Burst Spike]
        R6[RS-CORR-006: Multi-Signal Correlation]
        Correlator[Incident Correlator]
    end

    subgraph AI [Triage & Enrichment - LangGraph Engine]
        N1[Node 1: Input Validation]
        N2[Node 2: Event Context Enrichment]
        N3[Node 3: Evidence Analysis]
        N4[Node 4: Advisory Risk Assessment]
        N5[Node 5: Threat Summary Generator]
        N6[Node 6: Defensive Recommendations]
        N7[Node 7: Anti-Hallucination Guardrail]
        N8[Node 8: Human Review Checkpoint]
    end

    subgraph SOC [Presentation Layer]
        Dashboard[SOC Security Operations Dashboard]
        Timeline[Interactive Timeline & Evidence Graph]
        Review[Analyst Investigation & Review]
    end

    Sources --> Ingestion
    Ingestion --> Core
    Engine --> R1 & R2 & R3 & R4 & R5 & R6
    R1 & R2 & R3 & R4 & R5 & R6 --> Correlator
    Correlator --> N1
    N1 --> N2 --> N3 --> N4 --> N5 --> N6 --> N7
    N7 -- Passed --> N8
    N7 -- Retry <= 2 --> N5
    N8 --> SOC
```

## Service Communication
- **Flask Ingestion Microservice (`port 5001`)**: Authenticates log shippers via API tokens (`Authorization: Bearer <TOKEN>`), enforces a 512KB payload ceiling, validates schema, and dispatches to Django Core via internal webhook.
- **Django Core Platform (`port 8000`)**: Evaluates events across 6 deterministic rules, correlates alerts into incidents, records audit logs, and handles analyst actions.
- **LangGraph AI Orchestration**: Orchestrates an 8-node state workflow using TypedDict state schema, validating claims against ground telemetry to eliminate hallucinations.
