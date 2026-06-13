import type { Scenario } from '@/api/types'

export const NAV_ITEMS = [
  { path: '/', label: 'Predictor Portal', icon: 'Target' },
  { path: '/forecast', label: 'Forecaster', icon: 'LineChart' },
  { path: '/analytics', label: 'Platform Analytics', icon: 'Activity' },
  { path: '/monitoring', label: 'Monitoring', icon: 'Radio' },
  { path: '/training', label: 'Training', icon: 'Brain' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
] as const

export const SCENARIOS: Record<string, Scenario> = {
  peak: {
    label: 'Peak Hour',
    icon: 'Zap',
    features: {
      hour: 8,
      day_of_week: 2,
      month: 1,
      is_weekend: 0,
      lag_24h: 135.0,
      lag_12h: 132.3,
      roll_mean_24h: 137.7,
      roll_std_24h: 5.0,
    },
  },
  offpeak: {
    label: 'Off-Peak',
    icon: 'Moon',
    features: {
      hour: 2,
      day_of_week: 2,
      month: 1,
      is_weekend: 0,
      lag_24h: 95.0,
      lag_12h: 93.1,
      roll_mean_24h: 96.9,
      roll_std_24h: 3.5,
    },
  },
  weekend: {
    label: 'Weekend',
    icon: 'CalendarDays',
    features: {
      hour: 14,
      day_of_week: 5,
      month: 6,
      is_weekend: 1,
      lag_24h: 128.0,
      lag_12h: 125.4,
      roll_mean_24h: 130.6,
      roll_std_24h: 4.2,
    },
  },
  winter: {
    label: 'Winter Peak',
    icon: 'Snowflake',
    features: {
      hour: 18,
      day_of_week: 3,
      month: 12,
      is_weekend: 0,
      lag_24h: 150.0,
      lag_12h: 147.0,
      roll_mean_24h: 153.0,
      roll_std_24h: 6.5,
    },
  },
}

export const CHART_COLORS = {
  primary: '#18181b',
  secondary: '#71717a',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  grid: 'rgba(0,0,0,0.04)',
  tooltip_bg: '#ffffff',
  area_fill: 'rgba(24,24,27,0.05)',
  uncertainty: 'rgba(24,24,27,0.08)',
}

export const CHART_DEFAULTS = {
  xAxis: { stroke: '#e2e8f0', tick: { fill: '#64748b', fontSize: 12 } },
  yAxis: { stroke: '#e2e8f0', tick: { fill: '#64748b', fontSize: 12 } },
  cartesianGrid: { strokeDasharray: '3 3', stroke: CHART_COLORS.grid },
  tooltip: {
    contentStyle: {
      background: '#ffffff',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: '10px',
      color: '#0f172a',
    },
  },
}
