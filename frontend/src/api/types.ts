export interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  models_loaded: boolean
  data_path_exists: boolean
  last_training: string | null
  version: string
  timestamp: string
}

export interface ModelMetrics {
  MAE: number
  RMSE: number
  MAPE: number
}

export interface PerformanceSummary {
  n_evaluations: number
  avg_mae: number
  avg_rmse: number
  avg_mape: number
  models: {
    xgb: ModelMetrics
    lgb: ModelMetrics
    cat: ModelMetrics
    ensemble: ModelMetrics
  }
}

export interface Alert {
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: string
}

export interface MetricsResponse {
  performance: PerformanceSummary
  recent_alerts: Alert[]
  timestamp: string
}

export interface MonitoringResponse {
  performance: PerformanceSummary
  alerts: Alert[]
  timestamp: string
}

export interface PredictionFeatures {
  hour: number
  day_of_week: number
  month: number
  is_weekend: number
  lag_24h: number
  lag_12h: number
  roll_mean_24h: number
  roll_std_24h: number
}

export interface PredictionRequest {
  data: PredictionFeatures
  model: 'ensemble' | 'xgb' | 'lgb' | 'cat'
}

export interface PredictionResponse {
  prediction: number
  uncertainty: number
  xgb_pred: number
  lgb_pred: number
  cat_pred: number
  xgb_weight: number
  lgb_weight: number
  cat_weight: number
  timestamp: string
}

export interface ForecastRequest {
  horizon: number
}

export interface ForecastResponse {
  forecasts: number[]
  uncertainties: number[]
  horizon: number
  timestamp: string
}

export interface TrainingRequest {
  retrain: boolean
}

export interface TrainingResponse {
  train_size: number
  val_size: number
  test_size: number
  n_features: number
  individual_models: Record<string, { mae: number; rmse: number; mape: number }>
  ensemble: {
    mae: number
    rmse: number
    mape: number
    weights: { xgb: number; lgb: number; cat: number }
  }
  status: string
  timestamp: string
}

export interface TrainingStatusResponse {
  training_in_progress: boolean
  last_training: string | null
  timestamp: string
}

export interface Scenario {
  label: string
  icon: string
  features: PredictionFeatures
}
