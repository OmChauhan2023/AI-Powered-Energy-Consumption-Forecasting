# Deployment Guide

## Overview

This guide covers deployment options for the energy forecasting system.

---

## Local Development

### 1. Install Dependencies

```bash
cd "c:\Users\mohin\OneDrive\Desktop\AI Powered Energy Consumption Forcasting"
pip install -r requirements.txt
```

### 2. Run FastAPI Backend

**Terminal 1 - API Server:**
```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

API available at: http://localhost:8000

**Documentation:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3. Run Streamlit Dashboard

**Terminal 2 - Dashboard:**
```bash
streamlit run dashboard.py --server.port 8501
```

Dashboard available at: http://localhost:8501

### 4. Verify Setup

```bash
# Check API health
curl http://localhost:8000/health

# Dashboard should auto-connect to http://localhost:8000
```

---

## Docker Setup

### Build Images

```bash
cd "c:\Users\mohin\OneDrive\Desktop\AI Powered Energy Consumption Forcasting"

# Build API image
docker build -t energy-api -f Dockerfile .

# Build Dashboard image
docker build -t energy-dashboard -f Dockerfile.streamlit .
```

### Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Services:**
- API: http://localhost:8000
- Dashboard: http://localhost:8501

### Run Individual Services

```bash
# API only
docker-compose up api

# Dashboard only
docker-compose up dashboard
```

### Health Check

```bash
docker-compose ps
docker ps
```

---

## Cloud Deployment

### Option 1: Render (FastAPI)

**Setup:**

1. Create GitHub repository
```bash
cd "c:\Users\mohin\OneDrive\Desktop\AI Powered Energy Consumption Forcasting"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/energy-forecasting.git
git push -u origin main
```

2. Connect to Render
   - Go to https://render.com
   - New → Web Service
   - Connect GitHub repo
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn api.main:app --host 0.0.0.0 --port 8000`

3. Environment Variables
   - (Optional) Set any API-specific vars

4. Deploy
   - Click "Create Web Service"
   - Wait for build & deployment
   - API URL: `https://energy-api-xxxxx.onrender.com`

**Pros:**
- Free tier available
- Auto-deploys from GitHub
- 0.25 CPU, 512MB RAM free tier

**Cons:**
- Free tier: ~12 free hours/month
- Spins down after inactivity
- Limited resources

---

### Option 2: Streamlit Community Cloud (Dashboard)

**Setup:**

1. Push code to GitHub (see Render setup)

2. Deploy on Streamlit Cloud
   - Go to https://share.streamlit.io
   - Click "New app"
   - Select repo, branch, main file: `dashboard.py`
   - Deploy

3. Configure in dashboard
   - API URL setting: point to Render API

**Pros:**
- Free & unlimited
- No container needed
- Simple GitHub integration

**Cons:**
- No custom authentication
- Limited to Streamlit features

---

### Option 3: DigitalOcean App Platform

**Setup:**

1. Push code to GitHub

2. Create DigitalOcean account

3. Create App
   - Go to Apps → Create App
   - Connect GitHub
   - Select repo
   - Add services:
     - **API Service**: Port 8000, command `uvicorn api.main:app --host 0.0.0.0 --port 8000`
     - **Dashboard Service**: Port 8501, command `streamlit run dashboard.py --server.port 8501`

4. Configure Environment
   - (Optional) Add env vars

5. Deploy
   - Click "Create Resources"
   - Wait for build & deployment

**Pricing:**
- App Platform: $5/month per component
- Custom domain available

**Pros:**
- Good performance
- Custom domain support
- Full control

**Cons:**
- Not free
- More setup required

---

### Option 4: AWS Lambda (Serverless)

For serverless deployment of the API:

```bash
# Install serverless framework
npm install -g serverless

# Create serverless config
serverless create --template aws-python3

# Deploy
serverless deploy
```

**Note:** AWS Lambda has limitations for ML models due to package size and memory constraints.

---

### Option 5: Docker Hub + Any VPS

1. Push Docker image to Docker Hub
```bash
docker build -t yourusername/energy-api -f Dockerfile .
docker push yourusername/energy-api

docker build -t yourusername/energy-dashboard -f Dockerfile.streamlit .
docker push yourusername/energy-dashboard
```

2. On VPS (DigitalOcean, Linode, AWS EC2):
```bash
# SSH into VPS
ssh root@your-vps-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Pull and run
docker pull yourusername/energy-api
docker pull yourusername/energy-dashboard

# Run with docker-compose
docker-compose up -d
```

---

## Production Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set up authentication (JWT tokens)
- [ ] Configure rate limiting
- [ ] Enable CORS restrictions
- [ ] Set up monitoring & alerts
- [ ] Configure logging
- [ ] Set up database for metrics persistence
- [ ] Enable health checks
- [ ] Configure auto-restart
- [ ] Set up backup strategy
- [ ] Configure CDN for dashboard
- [ ] Set up API versioning
- [ ] Document API contracts
- [ ] Configure CI/CD pipeline

---

## Production Configuration

### FastAPI Security

```python
from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer
import os

security = HTTPBearer()

async def verify_token(credentials = Security(security)):
    token = credentials.credentials
    expected_token = os.getenv("API_TOKEN")
    if token != expected_token:
        raise HTTPException(status_code=403, detail="Invalid token")
    return token

# Apply to endpoints
@app.post("/train", dependencies=[Depends(verify_token)])
async def train(...):
    ...
```

### Enable HTTPS

```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["yourdomain.com", "api.yourdomain.com"]
)
```

### Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/predict")
@limiter.limit("100/minute")
async def predict(request, request_object):
    ...
```

### Database for Metrics

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./metrics.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Save metrics to DB instead of JSON
def save_metrics_to_db(metrics):
    db = SessionLocal()
    db.add(Metric(**metrics))
    db.commit()
    db.close()
```

---

## Monitoring & Logging

### Application Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api.log'),
        logging.StreamHandler()
    ]
)
```

### Performance Monitoring

```python
from prometheus_client import Counter, Histogram

prediction_counter = Counter('predictions_total', 'Total predictions')
prediction_duration = Histogram('prediction_duration_seconds', 'Prediction latency')

@prediction_duration.time()
@app.post("/predict")
async def predict(...):
    prediction_counter.inc()
    ...
```

### Error Tracking

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0
)
```

---

## Scaling

### Horizontal Scaling (Multiple API instances)

```yaml
# docker-compose.yml
api:
  build: .
  deploy:
    replicas: 3
  ports:
    - "8000-8002:8000"
```

### Load Balancing

```nginx
upstream api {
    server api1:8000;
    server api2:8000;
    server api3:8000;
}

server {
    listen 80;
    location /api {
        proxy_pass http://api;
    }
}
```

### Caching

```python
from fastapi_cache2 import FastAPICache2
from fastapi_cache2.backends.redis import RedisBackend
from redis import asyncio as aioredis

@cached(namespace="forecasts", expire=3600)
@app.post("/forecast")
async def forecast(...):
    ...
```

---

## Recommended Deployment Stack

**For Production:**

```
┌─────────────────────────────────────────┐
│         Render (API) + Streamlit Cloud  │
│              $5-10/month                 │
└─────────────────────────────────────────┘
         ↓           ↓
    FastAPI    Streamlit
    (Docker)   (Native)
         ↓
    ┌─────────────────┐
    │  Models (1GB)   │
    │  Data (100MB)   │
    └─────────────────┘
```

**For Enterprise:**

```
┌──────────────────────────────────────────┐
│      DigitalOcean App Platform           │
│         $10-50/month                      │
└──────────────────────────────────────────┘
    ↓              ↓              ↓
 FastAPI    Streamlit      PostgreSQL
(Docker)    (Docker)       (Managed)
    ↓________↓________↓
    Load Balancer (Nginx)
         ↓
   ┌──────────────────┐
   │  Models (1GB)    │
   │  Data (100MB)    │
   │  PostgreSQL      │
   └──────────────────┘
```

---

## Troubleshooting

### API won't start
```bash
# Check logs
docker-compose logs api

# Verify models exist
ls -la models/

# Check Python version
python --version  # Should be 3.8+
```

### Dashboard can't connect to API
```bash
# Check API is running
curl http://localhost:8000/health

# Update API URL in dashboard settings
# Use host.docker.internal instead of localhost for Docker
```

### High memory usage
```bash
# Model files too large?
du -sh models/

# Reduce batch size in requests
# Or scale horizontally
```

---

## Support & Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Streamlit Docs:** https://docs.streamlit.io
- **Docker:** https://docs.docker.com
- **Render:** https://render.com/docs
- **DigitalOcean:** https://docs.digitalocean.com
