import { apiClient } from './client'
import type {
  HealthResponse,
  MetricsResponse,
  MonitoringResponse,
  PredictionRequest,
  PredictionResponse,
  ForecastRequest,
  ForecastResponse,
  TrainingRequest,
  TrainingResponse,
  TrainingStatusResponse,
} from './types'

export const api = {
  getHealth: () => apiClient.get<HealthResponse>('/health'),

  getMetrics: () => apiClient.get<MetricsResponse>('/metrics'),

  getMonitoring: () => apiClient.get<MonitoringResponse>('/monitoring'),

  predict: (payload: PredictionRequest) => apiClient.post<PredictionResponse>('/predict', payload),

  forecast: (payload: ForecastRequest) => apiClient.post<ForecastResponse>('/forecast', payload),

  train: (payload: TrainingRequest) => apiClient.post<TrainingResponse>('/train', payload),

  getTrainingStatus: () => apiClient.get<TrainingStatusResponse>('/training_status'),
}
