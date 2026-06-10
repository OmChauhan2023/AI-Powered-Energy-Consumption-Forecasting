"""Pydantic models for API request/response validation."""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


class PredictionRequest(BaseModel):
    """Single prediction request."""
    data: Dict[str, float] = Field(..., description="Feature values as dict")
    model: str = Field(default="ensemble", description="Model to use: ensemble, xgb, lgb, cat")

    class Config:
        json_schema_extra = {
            "example": {
                "data": {
                    "hour": 14,
                    "day_of_week": 2,
                    "lag_24h": 125.5,
                    "roll_mean_24h": 128.3
                },
                "model": "ensemble"
            }
        }


class PredictionResponse(BaseModel):
    """Single prediction response."""
    prediction: float = Field(..., description="Predicted consumption (MWh)")
    uncertainty: float = Field(..., description="Uncertainty estimate")
    xgb_pred: float = Field(..., description="XGBoost prediction")
    lgb_pred: float = Field(..., description="LightGBM prediction")
    cat_pred: float = Field(..., description="CatBoost prediction")
    xgb_weight: float = Field(..., description="XGBoost weight")
    lgb_weight: float = Field(..., description="LightGBM weight")
    cat_weight: float = Field(..., description="CatBoost weight")
    timestamp: datetime


class BatchPredictionRequest(BaseModel):
    """Batch prediction request."""
    data: List[Dict[str, float]] = Field(..., description="List of feature dicts")

    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {"hour": 14, "day_of_week": 2, "lag_24h": 125.5},
                    {"hour": 15, "day_of_week": 2, "lag_24h": 128.3}
                ]
            }
        }


class BatchPredictionResponse(BaseModel):
    """Batch prediction response."""
    predictions: List[float]
    uncertainties: List[float]
    timestamp: datetime


class ForecastRequest(BaseModel):
    """Forecast request."""
    horizon: int = Field(default=24, description="Steps ahead to forecast", ge=1, le=168)


class ForecastResponse(BaseModel):
    """Forecast response."""
    forecasts: List[float] = Field(..., description="Forecasted values")
    uncertainties: List[float] = Field(..., description="Uncertainty for each step")
    horizon: int
    timestamp: datetime


class TrainingRequest(BaseModel):
    """Full pipeline training request."""
    retrain: bool = Field(default=False, description="Force retrain existing models")


class TrainingResponse(BaseModel):
    """Training completion response."""
    train_size: int
    val_size: int
    test_size: int
    n_features: int
    individual_models: Dict[str, Dict[str, float]]
    ensemble: Dict
    status: str = "completed"
    timestamp: datetime


class MetricsResponse(BaseModel):
    """Metrics response."""
    mae: float
    rmse: float
    mape: float
    mse: float
    model: str
    samples: int
    timestamp: datetime


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    models_loaded: bool
    data_path_exists: bool
    last_training: Optional[datetime] = None
    version: str = "1.0.0"
    timestamp: datetime


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    detail: Optional[str] = None
    timestamp: datetime


# ── Weather Models ─────────────────────────────────────────────────────────────

class WeatherCurrentResponse(BaseModel):
    """Current weather conditions for an Australian city."""
    city: str
    city_key: str
    temperature: float = Field(..., description="Temperature in °C")
    apparent_temperature: float = Field(..., description="Feels-like temperature in °C")
    humidity: float = Field(..., description="Relative humidity (%)")
    wind_speed: float = Field(..., description="Wind speed (km/h)")
    cloud_cover: float = Field(..., description="Cloud cover (%)")
    precipitation: float = Field(..., description="Current precipitation (mm)")
    weather_code: int
    condition: str = Field(..., description="Human-readable weather condition")
    energy_impact: str = Field(..., description="Expected energy demand impact")
    latitude: float
    longitude: float
    source: str
    timestamp: str
    cached: bool = False


class WeatherHourlyPoint(BaseModel):
    """Single hourly forecast data point."""
    time: str
    temperature: float
    humidity: float
    wind_speed: float
    cloud_cover: float
    precip_prob: float
    condition: str


class WeatherForecastSummary(BaseModel):
    avg_temp: float
    max_temp: float
    min_temp: float
    avg_humidity: float
    avg_cloud: float


class WeatherForecastResponse(BaseModel):
    """Hourly weather forecast for an Australian city."""
    city: str
    city_key: str
    hours: int
    hourly: List[WeatherHourlyPoint]
    summary: WeatherForecastSummary
    source: str
    timestamp: str
