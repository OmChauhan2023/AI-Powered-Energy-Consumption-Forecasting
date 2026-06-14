import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, ReferenceArea } from 'recharts'
import { CHART_COLORS, CHART_DEFAULTS } from '@/lib/constants'

export interface HighlightRegion {
  start: string
  end: string
  label: string
  color: string
}

interface ForecastChartProps {
  forecasts: number[]
  baselines?: number[]
  uncertainties: number[]
  labels?: string[]
  highlights?: HighlightRegion[]
  startHour?: number
}

export function ForecastChart({ forecasts, baselines, uncertainties, labels, highlights, startHour = new Date().getHours() }: ForecastChartProps) {
  const data = forecasts.map((forecast, i) => {
    const hour = (startHour + i) % 24
    const label = labels ? labels[i] : `${String(hour).padStart(2, '0')}:00`
    return {
      hour: i,
      label,
      forecast: Math.round(forecast * 10) / 10,
      baseline: baselines ? Math.round(baselines[i] * 10) / 10 : undefined,
      upper: Math.round((forecast + uncertainties[i]) * 10) / 10,
      lower: Math.round(Math.max(500, forecast - uncertainties[i]) * 10) / 10,
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const upper = payload.find((p: any) => p.dataKey === 'upper')?.value
      const lower = payload.find((p: any) => p.dataKey === 'lower')?.value
      const baseline = payload.find((p: any) => p.dataKey === 'baseline')?.value
      const forecast = payload.find((p: any) => p.dataKey === 'forecast')?.value

      return (
        <div className="bg-white/95 backdrop-blur-md border border-gray-200 p-4 rounded-xl shadow-xl w-64">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <span className="text-lg leading-none">📅</span>
            <span className="font-extrabold text-gray-900">{label}</span>
          </div>
          
          <div className="flex flex-col gap-2.5">
            {forecast !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-slate-900"></span> Affected
                </span>
                <span className="text-sm font-extrabold text-slate-900">{Number(forecast).toLocaleString()} MWh</span>
              </div>
            )}
            
            {baseline !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5 tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span> Baseline
                </span>
                <span className="text-sm font-extrabold text-slate-500">{Number(baseline).toLocaleString()} MWh</span>
              </div>
            )}

            <div className="mt-1 pt-2.5 border-t border-gray-100 flex flex-col gap-1.5 bg-yellow-50/50 -mx-4 px-4 pb-1 rounded-b-xl">
               <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-yellow-600 uppercase flex items-center gap-1.5 tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Max Error
                </span>
                <span className="text-xs font-extrabold text-yellow-700">{Number(upper).toLocaleString()} MWh</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-yellow-600 uppercase flex items-center gap-1.5 tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Min Error
                </span>
                <span className="text-xs font-extrabold text-yellow-700">{Number(lower).toLocaleString()} MWh</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={460}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="uncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#fef08a" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        
        {highlights && highlights.map((h, idx) => (
          <ReferenceArea 
            key={idx} 
            x1={h.start} 
            x2={h.end} 
            fill={h.color} 
            fillOpacity={0.08}
            label={{ value: h.label, position: 'insideTop', fill: h.color, fontSize: 12, fontWeight: 'bold' }} 
          />
        ))}

        <CartesianGrid {...CHART_DEFAULTS.cartesianGrid} />
        <XAxis
          dataKey="label"
          {...CHART_DEFAULTS.xAxis}
          interval={Math.max(0, Math.floor(forecasts.length / 12) - 1)}
          tick={{ fontSize: 11 }}
        />
        <YAxis {...CHART_DEFAULTS.yAxis} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Legend
          formatter={(value) => {
            if (value === 'upper') return '+/- Error Bounds'
            if (value === 'forecast') return 'Affected Scenario'
            if (value === 'baseline') return 'Baseline Trajectory'
            return null
          }}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area type="monotone" dataKey="upper" fill="url(#uncertaintyGradient)" stroke="#eab308" strokeDasharray="3 3" isAnimationActive={false} />
        <Area type="monotone" dataKey="lower" legendType="none" fill={CHART_COLORS.tooltip_bg} stroke="#eab308" strokeDasharray="3 3" isAnimationActive={false} />
        {baselines && (
          <Line
            type="monotone"
            dataKey="baseline"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={true}
          />
        )}
        <Line
          type="monotone"
          dataKey="forecast"
          stroke={CHART_COLORS.primary}
          strokeWidth={3}
          dot={false}
          isAnimationActive={true}
          animationDuration={600}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
