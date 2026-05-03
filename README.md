# Energy Consumption Forecasting System

A production-ready ML pipeline for hourly energy consumption prediction with a 4-agent architecture, FastAPI backend, and Streamlit dashboard.

## Features

### 🤖 4-Agent Architecture
- **DataAgent**: Data loading, preprocessing, feature engineering (35 features)
- **TrainingAgent**: Model training (XGBoost, LightGBM, CatBoost), ensemble optimization
- **InferenceAgent**: Single/batch predictions, uncertainty quantification, multi-step forecasting
- **MonitoringAgent**: Performance tracking, drift detection, anomaly detection

### 📊 Models & Ensemble
- **XGBoost**: 200-trial Optuna tuning (Best MAE: 24.78)
- **LightGBM**: 80-trial Optuna tuning
- **CatBoost**: 80-trial Optuna tuning (Best individual: MAE 28.25)
- **Ensemble**: Weighted combination (Test MAE: **28.33** - 23% improvement)

### 🌐 FastAPI Backend
- REST endpoints for predictions, forecasts, training, monitoring
- Async request handling
- OpenAPI documentation (Swagger UI)
- Health checks and error handling

### 📈 Streamlit Dashboard
- Interactive visualization
- Single/batch predictions with explanations
- Multi-step forecasting with uncertainty bands
- Performance monitoring & alerts
- Model training interface

### 🐳 Docker & Deployment
- Docker & Docker Compose support
- Deployment guides for Render, Streamlit Cloud, DigitalOcean, AWS

### ⚙️ Workflow Orchestration
- Prefect workflows for training, inference, forecasting

---

## Quick Start (2 minutes)

```bash
# Install dependencies
pip install -r requirements.txt

# Terminal 1: Start API
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Dashboard
streamlit run dashboard.py

# Open in browser:
# API Docs: http://localhost:8000/docs
# Dashboard: http://localhost:8501
```

## Docker Quick Start (3 minutes)

```bash
docker-compose up -d
# API: http://localhost:8000
# Dashboard: http://localhost:8501
```

---

## API Endpoints

- `GET /health` - Health check
- `POST /predict` - Single prediction with uncertainty
- `POST /predict_batch` - Batch predictions
- `POST /forecast` - Multi-step forecast
- `POST /train` - Start training pipeline
- `GET /metrics` - Performance metrics

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for full reference.

---

## Model Performance

| Model | MAE | RMSE |
|-------|-----|------|
| XGBoost | 35.83 | 48.12 |
| LightGBM | 36.91 | 50.23 |
| CatBoost | 28.25 | 40.18 |
| **Ensemble** | **28.33** | **40.61** |

**Improvement:** 23% over baseline (36.99 → 28.33 MAE)

---

## Project Structure

```
energy-forecasting/
├── agents/                 # 4-Agent architecture
│   ├── data_agent.py
│   ├── training_agent.py
│   ├── inference_agent.py
│   ├── monitoring_agent.py
│   └── orchestrator.py
├── api/                    # FastAPI backend
│   ├── main.py
│   └── models.py
├── workflows/              # Prefect workflows
├── dashboard.py            # Streamlit interface
├── data/                   # Input data
├── models/                 # Trained models
├── outputs/                # Results
└── Dockerfile              # Container setup
```

---

## Documentation

- [AGENTS_GUIDE.md](AGENTS_GUIDE.md) - Agent architecture
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference  
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment options
- [AGENTS_SUMMARY.md](AGENTS_SUMMARY.md) - Building summary

---

## Technology Stack

- **ML**: XGBoost, LightGBoost, CatBoost, scikit-learn
- **Backend**: FastAPI, Uvicorn, Pydantic
- **Frontend**: Streamlit, Plotly
- **Workflows**: Prefect
- **Containerization**: Docker, Docker Compose

---

## Quick Examples

### Python Client

```python
import requests

client = requests.post(
    "http://localhost:8000/predict",
    json={"data": {"hour": 14, "day_of_week": 2, "lag_24h": 125.5}, "model": "ensemble"}
)
result = client.json()
print(f"Prediction: {result['prediction']:.2f} ± {result['uncertainty']:.2f}")
```

### Training Pipeline

```python
from agents import PipelineOrchestrator

orch = PipelineOrchestrator()
results = orch.run_full_pipeline()
print(f"Ensemble MAE: {results['ensemble']['mae']:.2f}")
```

---

## Deployment

### Render (FastAPI)
1. Push to GitHub
2. Create Render account
3. New Web Service → Connect GitHub
4. Build: `pip install -r requirements.txt`
5. Start: `uvicorn api.main:app --host 0.0.0.0 --port 8000`

### Streamlit Community Cloud (Dashboard)
1. Push to GitHub
2. share.streamlit.io → New app → Select dashboard.py

[See DEPLOYMENT_GUIDE.md for full instructions](DEPLOYMENT_GUIDE.md)

---

## Team & Attribution

**Team Eagle** - Part of the Powermind Hackathon

Built with ❤️ for energy forecasting

---

## License

MIT License

---

## Support

- 📚 [Full Documentation](./docs)
- 🚀 [Deployment Guide](DEPLOYMENT_GUIDE.md)
- 📖 [API Reference](API_DOCUMENTATION.md)
- 💻 [FastAPI Docs (live)](http://localhost:8000/docs)
- 📊 [Streamlit Dashboard (live)](http://localhost:8501)
