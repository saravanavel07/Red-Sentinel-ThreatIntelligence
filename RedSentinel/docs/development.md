# RedSentinel Local Development & Testing Guide

## Prerequisites
- Python 3.10 or higher
- Git

## Setup Environment

```bash
# Clone the repository
git clone https://github.com/your-org/redsentinel-cloud-ai-threat-detection.git
cd redsentinel-cloud-ai-threat-detection/RedSentinel

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

## Running the Services

### 1. Run Django Core Web Application
```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 2. Run Flask Ingestion Microservice
```bash
python ingestion_service/app.py
# Listens on http://0.0.0.0:5001
```

### 3. Running Unit Tests
```bash
python -m unittest discover tests
```

### 4. Sending a Test Security Event via Ingestion Microservice
```bash
curl -X POST http://localhost:5001/api/v1/events/ingest \
  -H "Authorization: Bearer rs_live_secret_token_99b7c841e2a0487d" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "auth.failure",
    "account": "test.analyst@domain.com",
    "source_ip": "198.51.100.44",
    "eventName": "ConsoleLogin"
  }'
```
