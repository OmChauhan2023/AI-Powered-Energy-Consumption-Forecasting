import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CHART_COLORS, CHART_DEFAULTS } from '@/lib/constants'

interface HistoricalChartProps {
  data: { time: string; value: number }[]
}

export function HistoricalChart({ data }: HistoricalChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    time: new Date(d.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_DEFAULTS.cartesianGrid} />
        <XAxis dataKey="time" {...CHART_DEFAULTS.xAxis} />
        <YAxis {...CHART_DEFAULTS.yAxis} />
        <Tooltip {...CHART_DEFAULTS.tooltip} formatter={(value: any) => `${value.toFixed(1)} MWh`} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
          fill="url(#brandGradient)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
