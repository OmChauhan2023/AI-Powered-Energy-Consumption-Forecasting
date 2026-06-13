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
  ChatRequest,
  ChatResponse,
  ReportRequest
} from './types'

export const api = {
  getHealth: () => apiClient.get<HealthResponse>('/health'),

  getMetrics: () => apiClient.get<MetricsResponse>('/metrics'),

  getMonitoring: () => apiClient.get<MonitoringResponse>('/monitoring'),

  predict: (payload: PredictionRequest) => apiClient.post<PredictionResponse>('/predict', payload),

  forecast: (payload: ForecastRequest) => apiClient.post<ForecastResponse>('/forecast', payload),

  train: (payload: TrainingRequest) => apiClient.post<TrainingResponse>('/train', payload),

  getTrainingStatus: () => apiClient.get<TrainingStatusResponse>('/training_status'),

  // Weather
  getWeatherCurrent: (city: string = 'sydney') =>
    apiClient.get<WeatherCurrentResponse>(`/weather/current?city=${city}`),

  getWeatherForecast: (city: string = 'sydney', hours: number = 72) =>
    apiClient.get<WeatherForecastResponse>(`/weather/forecast?city=${city}&hours=${hours}`),

  getWeatherAllCities: () =>
    apiClient.get<{ cities: Record<string, WeatherCurrentResponse>; timestamp: string }>('/weather/cities'),

  // AI & Reporting
  chat: (data: ChatRequest) =>
    apiClient.post<ChatResponse>('/chat', data),

  generateReport: async (data: ReportRequest) => {
    // Requires a custom fetch to handle Blob downloading for PDF
    const response = await fetch('http://localhost:8000/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to generate report');
    return response.blob();
  }
}
