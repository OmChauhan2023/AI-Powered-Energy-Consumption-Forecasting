import { useMemo } from 'react'
import * as Icons from 'lucide-react'
import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { MetricCard } from '@/components/ui/MetricCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { WeatherPanel } from '@/components/ui/WeatherPanel'
import { HistoricalChart } from '@/components/charts/HistoricalChart'
import { HourlyPatternChart } from '@/components/charts/HourlyPatternChart'
import { useMetrics } from '@/hooks/useMetrics'
import { generateMockHistory, generateHourlyPattern } from '@/lib/utils'

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useMetrics()

  const historyData = useMemo(() => generateMockHistory(168), [])
  const hourlyData = useMemo(() => generateHourlyPattern(), [])

  const currentMWh = historyData.length > 0 ? historyData[historyData.length - 1].value : 0
  const avg24h = historyData.length >= 24 ? historyData.slice(-24).reduce((a, v) => a + v.value, 0) / 24 : 0
  const peak24h = historyData.length >= 24 ? Math.max(...historyData.slice(-24).map((v) => v.value)) : 0
  const min24h = historyData.length >= 24 ? Math.min(...historyData.slice(-24).map((v) => v.value)) : 0

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6">
        {/* KPI Cards */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label="Current Load" value={currentMWh} unit="MWh" icon={Icons.Zap} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label="24h Average" value={avg24h} unit="MWh" icon={Icons.BarChart2} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label="Peak (24h)" value={peak24h} unit="MWh" icon={Icons.TrendingUp} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label="Min (24h)" value={min24h} unit="MWh" icon={Icons.TrendingDown} />
        </div>

        {/* Charts */}
        <div className="col-span-12 xl:col-span-8">
          <GlassCard className="h-full">
            <h2 className="text-xl font-bold mb-4">Historical Consumption (Last 7 Days)</h2>
            <HistoricalChart data={historyData} />
          </GlassCard>
        </div>

        {/* Weather Panel */}
        <div className="col-span-12 xl:col-span-4">
          <WeatherPanel />
        </div>

        <div className="col-span-12">
          <GlassCard>
            <h2 className="text-xl font-bold mb-6">Model Performance</h2>
            {metricsLoading ? (
              <SkeletonCard count={1} />
            ) : metrics ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-text-muted font-semibold">Model</th>
                      <th className="px-4 py-3 text-right text-text-muted font-semibold">MAE (MWh)</th>
                      <th className="px-4 py-3 text-right text-text-muted font-semibold">RMSE (MWh)</th>
                      <th className="px-4 py-3 text-right text-text-muted font-semibold">MAPE (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.entries(metrics.performance.models).map(([name, m]) => (
                      <tr key={name} className="hover:bg-black/5 transition-colors">
                        <td className="px-4 py-3 font-semibold text-text-primary uppercase">{name}</td>
                        <td className="px-4 py-3 text-right text-text-secondary">{m.MAE.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-text-secondary">{m.RMSE.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-text-secondary">{m.MAPE.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-text-muted">Failed to load metrics</p>
            )}
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  )
}
