import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CHART_COLORS, CHART_DEFAULTS } from '@/lib/constants'
import type { PredictionResponse } from '@/api/types'

interface ModelComparisonChartProps {
  result: PredictionResponse
}

export function ModelComparisonChart({ result }: ModelComparisonChartProps) {
  const data = [
    {
      name: 'XGBoost',
      prediction: result.xgb_pred,
    },
    {
      name: 'LightGBM',
      prediction: result.lgb_pred,
    },
    {
      name: 'CatBoost',
      prediction: result.cat_pred,
    },
    {
      name: 'Ensemble',
      prediction: result.prediction,
    },
  ]

  const minVal = Math.min(...data.map((d) => d.prediction)) * 0.98
  const maxVal = Math.max(...data.map((d) => d.prediction)) * 1.02

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid {...CHART_DEFAULTS.cartesianGrid} />
        <XAxis dataKey="name" {...CHART_DEFAULTS.xAxis} />
        <YAxis domain={[minVal, maxVal]} {...CHART_DEFAULTS.yAxis} />
        <Tooltip {...CHART_DEFAULTS.tooltip} formatter={(value: any) => `${value.toFixed(1)} MWh`} />
        <Bar dataKey="prediction" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
