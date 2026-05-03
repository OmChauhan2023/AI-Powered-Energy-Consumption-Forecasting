# FastAPI Backend Documentation

## Overview

The FastAPI backend provides RESTful endpoints for the energy forecasting system powered by the 4-agent ML pipeline.

**Base URL:** `http://localhost:8000`

---

## Endpoints

### 1. Health & Info

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": true,
  "data_path_exists": true,
  "last_training": "2024-05-03T14:30:00",
  "version": "1.0.0",
  "timestamp": "2024-05-03T14:35:00"
}
```

**Status Codes:**
- 200: Healthy

---

#### GET `/info`
API information and available endpoints.

**Response:**
```json
{
  "name": "Energy Forecasting API",
  "version": "1.0.0",
  "agents": [
    {"name": "DataAgent", "role": "Data loading & preprocessing"},
    {"name": "TrainingAgent", "role": "Model training & ensemble optimization"},
    {"name": "InferenceAgent", "role": "Predictions & forecasts"},
    {"name": "MonitoringAgent", "role": "Performance tracking & alerts"}
  ],
  "endpoints": {...},
  "timestamp": "2024-05-03T14:35:00"
}
```

---

#### GET `/`
Root endpoint with documentation links.

---

### 2. Predictions

#### POST `/predict`
Make a single prediction with uncertainty and feature importance.

**Request:**
```json
{
  "data": {
    "hour": 14,
    "day_of_week": 2,
    "lag_24h": 125.5,
    "roll_mean_24h": 128.3,
    "lag_12h": 130.0,
    "roll_std_24h": 5.0,
    "month": 5,
    "is_weekend": 0
  },
  "model": "ensemble"
}
```

**Parameters:**
- `data` (dict): Feature values as a dictionary
- `model` (str, optional): Model to use - "ensemble", "xgb", "lgb", "cat" (default: "ensemble")

**Response:**
```json
{
  "prediction": 125.42,
  "uncertainty": 2.13,
  "details": {
    "xgb": 125.42,
    "lgb": 128.15,
    "cat": 123.89,
    "ensemble": 125.12,
    "weights": {
      "xgb": 0.05,
      "lgb": 0.30,
      "cat": 0.65
    }
  },
  "weights": {"xgb": 0.05, "lgb": 0.30, "cat": 0.65},
  "top_features": [
    ["lag_24h", 0.85],
    ["hour", 0.72],
    ["day_of_week", 0.68],
    ["roll_mean_24h", 0.65],
    ["lag_12h", 0.60]
  ],
  "timestamp": "2024-05-03T14:35:00"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid input
- 500: Server error

---

#### POST `/predict_batch`
Make batch predictions for multiple samples.

**Request:**
```json
{
  "data": [
    {"hour": 14, "day_of_week": 2, "lag_24h": 125.5, ...},
    {"hour": 15, "day_of_week": 2, "lag_24h": 128.3, ...},
    {"hour": 16, "day_of_week": 2, "lag_24h": 130.0, ...}
  ]
}
```

**Response:**
```json
{
  "predictions": [125.42, 128.15, 123.89],
  "uncertainties": [2.13, 1.98, 2.45],
  "timestamp": "2024-05-03T14:35:00"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid input
- 500: Server error

---

### 3. Forecasting

#### POST `/forecast`
Generate multi-step ahead forecast with uncertainty bands.

**Request:**
```json
{
  "horizon": 24
}
```

**Parameters:**
- `horizon` (int): Steps ahead to forecast (1-168, default: 24)

**Response:**
```json
{
  "forecasts": [125.42, 128.15, 123.89, ...],
  "uncertainties": [2.13, 1.98, 2.45, ...],
  "horizon": 24,
  "timestamp": "2024-05-03T14:35:00"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid horizon
- 500: Server error

---

### 4. Training

#### POST `/train`
Trigger full training pipeline (runs asynchronously in background).

**Request:**
```json
{
  "retrain": false
}
```

**Parameters:**
- `retrain` (bool, optional): Force retrain existing models (default: false)

**Response:** (Accepted 202)
```json
{
  "train_size": 19878,
  "val_size": 4265,
  "test_size": 4265,
  "n_features": 35,
  "individual_models": {
    "xgb": {"mae": 35.83, "rmse": 48.12},
    "lgb": {"mae": 36.91, "rmse": 50.23},
    "cat": {"mae": 28.25, "rmse": 40.18}
  },
  "ensemble": {
    "mae": 28.33,
    "rmse": 40.61,
    "weights": {"xgb": 0.05, "lgb": 0.30, "cat": 0.65}
  },
  "status": "training_started",
  "timestamp": "2024-05-03T14:35:00"
}
```

**Status Codes:**
- 202: Training started
- 409: Training already in progress
- 400: Invalid request
- 500: Server error

---

#### GET `/training_status`
Check current training status.

**Response:**
```json
{
  "training_in_progress": false,
  "last_training": "2024-05-03T10:30:00",
  "timestamp": "2024-05-03T14:35:00"
}
```

---

### 5. Metrics & Monitoring

#### GET `/metrics`
Get latest metrics summary (last 24 hours).

**Response:**
```json
{
  "performance": {
    "n_evaluations": 12,
    "avg_mae": 28.5,
    "max_mae": 35.2,
    "min_mae": 22.1,
    "std_mae": 3.8,
    "time_window_hours": 24
  },
  "recent_alerts": [
    {
      "timestamp": "2024-05-03T14:00:00",
      "severity": "MEDIUM",
      "type": "DRIFT_DETECTED",
      "details": {...}
    }
  ],
  "timestamp": "2024-05-03T14:35:00"
}
```

---

#### GET `/monitoring`
Get full monitoring data.

**Response:**
```json
{
  "performance": {...},
  "alerts": [...],
  "timestamp": "2024-05-03T14:35:00"
}
```

---

#### POST `/alerts/clear`
Clear all alerts.

**Response:**
```json
{
  "message": "Alerts cleared",
  "timestamp": "2024-05-03T14:35:00"
}
```

---

## Authentication

Currently, no authentication is required. For production, implement JWT token validation:

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_token(credentials = Depends(security)):
    # Validate token
    ...
```

---

## Rate Limiting

Currently, no rate limiting is implemented. For production, use:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
```

---

## Error Handling

All errors return standardized error response:

```json
{
  "error": "Error message",
  "detail": "Detailed error description",
  "timestamp": "2024-05-03T14:35:00"
}
```

**Common Error Codes:**
- 400: Bad Request (invalid input)
- 409: Conflict (training already in progress)
- 500: Internal Server Error

---

## Running the API

### Local Development

```bash
cd "c:\Users\mohin\OneDrive\Desktop\AI Powered Energy Consumption Forcasting"
pip install -r requirements.txt
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

**Access:**
- API: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs
- Alternative docs (ReDoc): http://localhost:8000/redoc

### Docker

```bash
docker build -t energy-api .
docker run -p 8000:8000 -v $(pwd)/data:/app/data -v $(pwd)/models:/app/models energy-api
```

### Docker Compose

```bash
docker-compose up api
```

---

## Testing Endpoints

### Using cURL

```bash
# Health check
curl http://localhost:8000/health

# Single prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"data": {"hour": 14, "day_of_week": 2, "lag_24h": 125.5}, "model": "ensemble"}'

# Forecast
curl -X POST http://localhost:8000/forecast \
  -H "Content-Type: application/json" \
  -d '{"horizon": 24}'

# Start training
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d '{"retrain": false}'
```

### Using Python requests

```python
import requests

base_url = "http://localhost:8000"

# Health
response = requests.get(f"{base_url}/health")
print(response.json())

# Predict
response = requests.post(
    f"{base_url}/predict",
    json={"data": {"hour": 14, "day_of_week": 2, "lag_24h": 125.5}, "model": "ensemble"}
)
print(response.json())

# Forecast
response = requests.post(f"{base_url}/forecast", json={"horizon": 24})
print(response.json())
```

### Using Python client

```python
import requests
from typing import Dict, List

class EnergyForecastingClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url

    def health(self):
        return requests.get(f"{self.base_url}/health").json()

    def predict(self, features: Dict[str, float]) -> Dict:
        return requests.post(
            f"{self.base_url}/predict",
            json={"data": features, "model": "ensemble"}
        ).json()

    def predict_batch(self, features_list: List[Dict]) -> Dict:
        return requests.post(
            f"{self.base_url}/predict_batch",
            json={"data": features_list}
        ).json()

    def forecast(self, horizon: int = 24) -> Dict:
        return requests.post(
            f"{self.base_url}/forecast",
            json={"horizon": horizon}
        ).json()

    def metrics(self) -> Dict:
        return requests.get(f"{self.base_url}/metrics").json()

    def train(self, retrain: bool = False) -> Dict:
        return requests.post(
            f"{self.base_url}/train",
            json={"retrain": retrain}
        ).json()

# Usage
client = EnergyForecastingClient()
health = client.health()
print(f"API Status: {health['status']}")

forecast = client.forecast(horizon=24)
print(f"24-hour forecast: {forecast['forecasts']}")
```

---

## Performance

- Single prediction: ~10-50ms
- Batch prediction (100 samples): ~100-300ms
- Forecast (24 steps): ~500-1000ms
- Training pipeline: ~5-10 minutes

---

## Environment Variables

Optional environment variables:

```bash
API_PORT=8000
API_HOST=0.0.0.0
LOG_LEVEL=INFO
```

---

## Architecture

```
FastAPI App
├── Health Check Endpoints
├── Prediction Endpoints
│   ├── Single prediction
│   └── Batch prediction
├── Forecast Endpoints
├── Training Endpoints
├── Monitoring Endpoints
└── Error Handlers

↓

PipelineOrchestrator
├── DataAgent
├── TrainingAgent
├── InferenceAgent
└── MonitoringAgent
```

---

## Support

For issues or questions:
1. Check `/health` endpoint
2. Review API logs
3. Check model files exist in `models/` directory
4. Verify data path in `data/energy_consumption.csv`
