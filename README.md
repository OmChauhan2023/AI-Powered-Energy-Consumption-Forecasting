# ⚡ Energy Consumption Forecasting System
**An AI-Powered Multi-Agent ML Pipeline for Hourly Energy Prediction**

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![React](https://img.shields.io/badge/React-18.0+-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)

---

> **🏆 Adani Powermind Hackathon - May 2026**
> 
> Built by **Team Eagle**: Om Chauhan, Dhruv Patel, Kshitij Srivastava, Jaimin Koriya, and Anand Tiwari.

## 🎯 Project Overview

This is a **production-grade energy consumption forecasting system** built for the **Powermind Hackathon** by **Team Eagle**. It predicts hourly electricity consumption for the energy grid with a **23% accuracy improvement** over the baseline using a Bayesian-optimized ensemble of gradient boosting models.

**Key Achievement:** Ensemble MAE of **28.33 MWh** (23% improvement from baseline 37.00)

---

## ✨ Key Features

### 🤖 4-Agent Architecture
- **DataAgent** - Data loading, preprocessing, feature engineering (35+ features)
- **TrainingAgent** - Model training, hyperparameter tuning, ensemble optimization
- **InferenceAgent** - Single/batch predictions, multi-step forecasting, uncertainty quantification
- **MonitoringAgent** - Performance tracking, drift detection, anomaly detection

### 📊 Ensemble ML Pipeline
- **XGBoost** - 200-trial Optuna tuning (MAE: 37.20)
- **LightGBM** - 80-trial tuning (MAE: 39.78)
- **CatBoost** - 80-trial tuning (MAE: 42.78)
- **Weighted Ensemble** - Optimized weights: XGB 5%, LGB 30%, CatBoost 65% (MAE: 28.33)

### 🌐 Full Stack
- **Backend:** FastAPI with async endpoints (10+ endpoints)
- **Frontend:** React 18 with TypeScript, Vite, Tailwind CSS
- **Deployment:** Docker & Docker Compose ready
- **Monitoring:** Real-time drift detection, anomaly detection, performance tracking

### 🎨 Enterprise Dashboard
The frontend is a highly complex, information-dense React application designed for operational control and real-time monitoring.

- **Predictor Portal:** A live interface with interactive scenario simulations (Peak, Off-Peak, Winter) to instantly evaluate grid impact.
- **Exploratory Data Analysis (EDA):** Visual analytics including target variable distributions, daily/monthly seasonality profiles, and temperature correlations.
- **Pipeline Control:** Live visualization of the Optuna hyperparameter tuning landscape.
- **Model Architecture:** Interactive directed graphs mapping the exact workflow of the 4-Agent Orchestrator pipeline.
- **System Diagnostics:** Real-time API latency monitoring and Ensemble Model status tracking.

### 📈 Advanced Features
- **Uncertainty Quantification** - Confidence intervals for all predictions
- **Multi-Step Forecasting** - 1-72 hour ahead forecasts with uncertainty bands
- **Feature Engineering** - 35+ temporal, cyclical, lag, and seasonal features
- **Drift Detection** - Kolmogorov-Smirnov test for distribution shifts
- **Interactive Dashboard** - Real-time visualizations with React

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Option 1: Local Development (Recommended)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Terminal 1: Start FastAPI backend
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start React frontend
cd frontend
npm install
npm run dev

# Terminal 3 (optional): Start Streamlit dashboard
streamlit run dashboard.py --server.port 8501
```

**Access:**
- 🔵 React Dashboard: http://localhost:3000
- 🔵 FastAPI Docs: http://localhost:8000/docs
- 📊 Streamlit Dashboard: http://localhost:8501

### Option 2: Docker (Single Command)

```bash
docker-compose up -d

# API: http://localhost:8000
# Dashboard: http://localhost:8501
```

---

## 📁 Project Structure

```
energy-forecasting/
├── backend/                         # FastAPI & ML Backend
│   ├── agents/                      # 4-Agent orchestrator system
│   ├── api/                         # FastAPI endpoints & models
│   ├── src/                         # Data processing & feature engineering
│   ├── data/                        # Raw & processed CSV datasets
│   ├── models/                      # Saved ensemble weights & Optuna trials
│   ├── outputs/                     # Generated charts and logs
│   └── requirements.txt             # Python dependencies
│
├── frontend/                        # React Enterprise Dashboard
│   ├── src/
│   │   ├── pages/                   # 7-page Control Plane views
│   │   ├── components/              # Interactive ECharts & Glass UI
│   │   ├── api/                     # Axios client & Types
│   │   ├── hooks/                   # Custom React hooks
│   │   └── store/                   # Zustand state management
│   ├── package.json
│   └── vite.config.ts
│
├── deployment_guide.md              # Vercel & Render instructions
├── PROJECT_PRESENTATION.md          # 18-slide presentation for judges
├── TECHNICAL_DOCUMENTATION.md       # Complete system documentation
├── DOCUMENTS_GUIDE.md               # Navigation guide
├── Dockerfile                       # Container setup
├── docker-compose.yml               # Multi-service orchestration
└── README.md                        # This file
```

---

## 📊 Model Performance

### Test Set Results
```
Individual Models:
├── XGBoost   → MAE: 37.20, RMSE: 50.56, MAPE: 4.13%
├── LightGBM  → MAE: 39.78, RMSE: 52.34, MAPE: 4.43%
└── CatBoost  → MAE: 42.78, RMSE: 55.89, MAPE: 4.74%

Ensemble (Optimized):
└── Ensemble  → MAE: 28.33, RMSE: 40.61, MAPE: 4.05% ✓ Best!

Improvement vs Baseline: 23% (36.99 → 28.33)
Data Split: 70% train (30,710), 15% val (6,581), 15% test (6,581)
Features: 35+ engineered from raw consumption data
```

---

## 🔌 API Endpoints

### Core Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | System health check |
| `/info` | GET | API information |
| `/predict` | POST | Single prediction with uncertainty |
| `/predict_batch` | POST | Batch predictions |
| `/forecast` | POST | Multi-step forecast (1-72 hours) |
| `/train` | POST | Trigger training pipeline |
| `/metrics` | GET | Performance metrics |
| `/monitoring` | GET | Full monitoring data |
| `/training_status` | GET | Check training progress |
| `/alerts/clear` | POST | Clear alerts |

**Full API Docs:** http://localhost:8000/docs (Swagger UI)

### Example: Single Prediction

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "hour": 14,
      "day_of_week": 2,
      "lag_24h": 125.5,
      "lag_12h": 128.3,
      "roll_mean_24h": 127.5
    }
  }'
```

**Response:**
```json
{
  "prediction": 127.34,
  "uncertainty": 4.8,
  "xgb_pred": 124.6,
  "lgb_pred": 128.9,
  "cat_pred": 127.2,
  "xgb_weight": 0.05,
  "lgb_weight": 0.30,
  "cat_weight": 0.65,
  "timestamp": "2024-05-04T14:30:00"
}
```

---

## 🎨 React Dashboard Features

### Pages (7 Total)
1. **Overview** - System health, key metrics, current consumption
2. **Dashboard** - Real-time energy consumption & forecasts
3. **Predictions** - Single/batch prediction interface
4. **Forecasting** - Multi-step forecasts with uncertainty bands
5. **Monitoring** - Performance metrics, drift detection, alerts
6. **Training** - Trigger model training, view training status
7. **Settings** - API configuration, theme, preferences

### Interactive Components
- Real-time consumption charts (Recharts)
- Forecast visualization with uncertainty bands
- Model comparison (MAE, RMSE, MAPE)
- Performance trends (24h, 7d, 30d)
- Alert notifications
- Responsive grid layout
- Dark/Light theme support

---

## 🔬 Feature Engineering (35+ Features)

### Temporal Features (7)
- hour, day_of_week, day_of_month, month, quarter
- is_weekend, is_holiday

### Cyclical Encoding (4)
- hour_sin, hour_cos, month_sin, month_cos
- Preserves circularity (hour 23 → hour 0)

### Lag Features (6)
- lag_12h, lag_24h, lag_48h, lag_7d, lag_30d, lag_365d
- Captures autoregressive patterns

### Rolling Statistics (8)
- roll_mean_24h, roll_std_24h, roll_max_24h, roll_min_24h
- roll_mean_7d, roll_std_7d, roll_mean_30d, roll_std_30d

### Seasonal Decomposition (3)
- trend_component, seasonal_component, residual_component
- Extracted via statsmodels decomposition

### Domain Features (7+)
- hour_category (morning/evening/night peaks)
- is_business_day
- days_since_holiday
- Weather features (if available)

---

## 📈 Training Pipeline

### 1. Data Loading & Preprocessing
```
Raw CSV → Normalize timestamps → Fill missing values → 
Flag anomalies → Preprocess → Feature Engineering
```

### 2. Data Splitting
```
70% Training (30,710 samples) → 15% Validation (6,581) → 15% Test (6,581)
```

### 3. Model Training
```
XGBoost (3200 trees, tuned params) ↓
LightGBM (2500 trees, tuned params) → Ensemble Weight Optimization →
CatBoost (1000 trees, tuned params) ↓
                                    ↓
                        Final Ensemble Model
```

### 4. Ensemble Weight Optimization
```
Minimize MAE on validation set using L-BFGS-B
Result: [0.05, 0.30, 0.65] for [XGB, LGB, CatBoost]
```

### 5. Evaluation & Monitoring
```
Calculate MAE, RMSE, MAPE on test set
Detect drift, anomalies, data quality issues
Log alerts and metrics
```

---

## 🔍 Monitoring & Drift Detection

### Real-Time Checks
- **Performance Tracking** - MAE, RMSE, MAPE per prediction
- **Data Quality** - Missing values, duplicates, type validation
- **Drift Detection** - Kolmogorov-Smirnov test for distribution shifts
- **Anomaly Detection** - Z-score method on residuals
- **Alert System** - Severity levels (LOW, MEDIUM, HIGH)

### Metrics Stored
```json
{
  "timestamp": "2024-05-04T14:30:00",
  "model": "ensemble",
  "samples": 1000,
  "mae": 28.33,
  "rmse": 40.61,
  "mape": 4.05,
  "alerts": [...]
}
```

---

## 🐳 Docker Deployment

### Build & Run
```bash
# Build images
docker build -t energy-api -f Dockerfile .
docker build -t energy-dashboard -f Dockerfile.streamlit .

# Or use Docker Compose
docker-compose up -d
```

## 📚 Documentation

This project includes comprehensive documentation:

1. **PROJECT_PRESENTATION.md** - 18 slides for judges
   - Problem statement & solution overview
   - Model performance & results
   - Deployment options & use cases
   - Q&A talking points

2. **TECHNICAL_DOCUMENTATION.md** - Complete technical guide
   - Architecture & 4-agent system
   - Data pipeline & feature engineering
   - Model training & ensemble learning
   - API reference & deployment guide

3. **DOCUMENTS_GUIDE.md** - Navigation guide
   - How to use the documents
   - Quick facts to memorize
   - Next steps & recommendations

---

## 🔧 Technology Stack

| Category | Technologies |
|----------|---------------|
| **ML Models** | XGBoost 2.0+, LightGBM 4.0+, CatBoost 1.2+ |
| **Data Processing** | pandas 2.0+, numpy 1.24+, scipy 1.10+ |
| **Backend** | FastAPI 0.115+, Uvicorn 0.30+, Pydantic 2.0+ |
| **Frontend** | React 18.3+, TypeScript 5.5+, Vite 5.4+, Tailwind 3.4+ |
| **Visualizations** | Plotly 5.0+, Recharts 2.12+, Framer Motion |
| **Containerization** | Docker, Docker Compose |
| **Python** | 3.11-slim |

---

## 💡 Key Innovations

1. **4-Agent Architecture** - Modular, testable, easy to upgrade
2. **Ensemble Weight Optimization** - Not just averaging, optimized on validation set
3. **Uncertainty Quantification** - Model disagreement → confidence intervals
4. **Automated Monitoring** - Real-time drift & anomaly detection
5. **Production-Grade Code** - Async/await, comprehensive error handling, logging
6. **Advanced Feature Engineering** - 35+ features capturing temporal patterns
7. **Full Stack Solution** - Backend API + React frontend in one repo

---

## 📈 Use Cases

- **Grid Operators** - Predict demand 24-72 hours ahead, plan generation
- **Energy Retailers** - Price electricity based on predicted demand
- **Renewable Providers** - Optimize solar/wind generation coordination
- **Utilities & Analysts** - Detect patterns, plan infrastructure upgrades
- **Industrial Consumers** - Schedule energy-intensive processes optimally

---