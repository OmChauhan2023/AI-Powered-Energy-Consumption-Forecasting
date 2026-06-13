import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { CHART_COLORS, CHART_DEFAULTS } from '@/lib/constants'

interface ForecastChartProps {
  forecasts: number[]
  uncertainties: number[]
  labels?: string[]
  startHour?: number
}

export function ForecastChart({ forecasts, uncertainties, labels, startHour = new Date().getHours() }: ForecastChartProps) {
  const data = forecasts.map((forecast, i) => {
    const hour = (startHour + i) % 24
    const label = labels ? labels[i] : `${String(hour).padStart(2, '0')}:00`
    return {
      hour: i,
      label,
      forecast: Math.round(forecast * 10) / 10,
      upper: Math.round((forecast + uncertainties[i]) * 10) / 10,
      lower: Math.round(Math.max(500, forecast - uncertainties[i]) * 10) / 10,
    }
  })

  const avg = forecasts.reduce((a, b) => a + b, 0) / forecasts.length

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="uncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.uncertainty} stopOpacity={0.25} />
            <stop offset="100%" stopColor={CHART_COLORS.uncertainty} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_DEFAULTS.cartesianGrid} />
        <XAxis
          dataKey="label"
          {...CHART_DEFAULTS.xAxis}
          interval={Math.max(0, Math.floor(forecasts.length / 12) - 1)}
          tick={{ fontSize: 11 }}
        />
        <YAxis {...CHART_DEFAULTS.yAxis} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
        <Tooltip
          {...CHART_DEFAULTS.tooltip}
          formatter={(value: any, name: string) => {
            const labelsMap: Record<string, string> = { forecast: 'Forecast', upper: 'Upper bound', lower: 'Lower bound' }
            return [`${Number(value).toFixed(1)} MWh`, labelsMap[name] ?? name]
          }}
          labelFormatter={(label) => `📅 ${label}`}
        />
        <Legend
          formatter={(value) => value === 'upper' ? 'Uncertainty band' : value === 'forecast' ? 'Ensemble forecast' : null}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area type="monotone" dataKey="upper" fill="url(#uncertaintyGradient)" stroke="none" isAnimationActive={false} />
        <Area type="monotone" dataKey="lower" fill={CHART_COLORS.tooltip_bg} stroke="none" isAnimationActive={false} />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke={CHART_COLORS.primary}
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={true}
          animationDuration={600}
        />
        <ReferenceLine
          y={avg}
          stroke={CHART_COLORS.warning}
          strokeDasharray="4 4"
          label={{ value: `Avg ${avg.toFixed(0)} MWh`, position: 'insideTopRight', fill: CHART_COLORS.warning, fontSize: 11, offset: -8 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
