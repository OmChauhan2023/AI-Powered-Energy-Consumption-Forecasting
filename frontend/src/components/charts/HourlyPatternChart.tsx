import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CHART_COLORS, CHART_DEFAULTS } from '@/lib/constants'

interface HourlyPatternChartProps {
  data: { hour: number; label: string; avg: number }[]
}

export function HourlyPatternChart({ data }: HourlyPatternChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
            <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_DEFAULTS.cartesianGrid} />
        <XAxis dataKey="label" {...CHART_DEFAULTS.xAxis} fontSize={11} />
        <YAxis {...CHART_DEFAULTS.yAxis} />
        <Tooltip {...CHART_DEFAULTS.tooltip} formatter={(value: any) => `${value.toFixed(1)} MWh`} />
        <Bar dataKey="avg" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
