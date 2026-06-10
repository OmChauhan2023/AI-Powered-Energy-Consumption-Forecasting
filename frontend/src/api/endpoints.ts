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
  WeatherCurrentResponse,
  WeatherForecastResponse,
} from './types'

export const api = {
  getHealth: () => apiClient.get<HealthResponse>('/health'),

  getMetrics: () => apiClient.get<MetricsResponse>('/metrics'),

  getMonitoring: () => apiClient.get<MonitoringResponse>('/monitoring'),

  predict: (payload: PredictionRequest) => apiClient.post<PredictionResponse>('/predict', payload),

  forecast: (payload: ForecastRequest) => apiClient.post<ForecastResponse>('/forecast', payload),

  train: (payload: TrainingRequest) => apiClient.post<TrainingResponse>('/train', payload),

  getTrainingStatus: () => apiClient.get<TrainingStatusResponse>('/training_status'),

  // Weather endpoints
  getWeatherCurrent: (city = 'sydney') =>
    apiClient.get<WeatherCurrentResponse>(`/weather/current?city=${city}`),

  getWeatherForecast: (city = 'sydney', hours = 72) =>
    apiClient.get<WeatherForecastResponse>(`/weather/forecast?city=${city}&hours=${hours}`),

  getWeatherAllCities: () =>
    apiClient.get<{ cities: WeatherCurrentResponse[]; timestamp: string }>('/weather/cities'),
}
