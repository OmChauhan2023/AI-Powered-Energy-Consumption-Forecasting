import { useMemo, useState } from 'react'
import * as Icons from 'lucide-react'
import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { MetricCard } from '@/components/ui/MetricCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { StatCard } from '@/components/ui/StatCard'
import { WeatherPanel } from '@/components/ui/WeatherPanel'
import { HistoricalChart } from '@/components/charts/HistoricalChart'
import { useMetrics } from '@/hooks/useMetrics'
import { generateMockHistory } from '@/lib/utils'

export default function PlatformAnalytics() {
  const { data: metrics, isLoading: metricsLoading } = useMetrics()
  const [activeTab, setActiveTab] = useState<'monitoring' | 'training'>('monitoring')
  const historyData = useMemo(() => generateMockHistory(168), [])

  const currentMWh = historyData.length > 0 ? historyData[historyData.length - 1].value : 0
  const avg24h = historyData.length >= 24 ? historyData.slice(-24).reduce((a, v) => a + v.value, 0) / 24 : 0
  const peak24h = historyData.length >= 24 ? Math.max(...historyData.slice(-24).map((v) => v.value)) : 0
  const min24h = historyData.length >= 24 ? Math.min(...historyData.slice(-24).map((v) => v.value)) : 0

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6">
        {/* =========================================================
            SECTION 1: THE ENGINE (DASHBOARD)
            ========================================================= */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label="Current Load" value={currentMWh.toFixed(2)} unit="MWh" icon={Icons.Zap} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label="24h Average" value={avg24h.toFixed(2)} unit="MWh" icon={Icons.BarChart2} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label="Peak (24h)" value={peak24h.toFixed(2)} unit="MWh" icon={Icons.TrendingUp} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label="Min (24h)" value={min24h.toFixed(2)} unit="MWh" icon={Icons.TrendingDown} />
        </div>

        <div className="col-span-12 xl:col-span-8">
          <GlassCard className="h-full">
            <h2 className="text-xl font-bold mb-4">Historical Consumption (Last 7 Days)</h2>
            <HistoricalChart data={historyData} />
          </GlassCard>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <WeatherPanel />
        </div>

        {/* =========================================================
            SECTION 2: THE MECHANICS (PERFORMANCE & ENSEMBLE INFO)
            ========================================================= */}
        <div className="col-span-12 border-b border-border my-4" />

        <div className="col-span-12 xl:col-span-8">
          <GlassCard className="h-full">
            <h2 className="text-xl font-bold mb-6">Real-Time Model Performance</h2>
            {metricsLoading ? <SkeletonCard count={1} /> : metrics ? (
              <div className="overflow-x-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard label="Live Mean Absolute Error" value={metrics?.performance.avg_mae.toFixed(2) || '--'} unit="MWh" />
                  <StatCard label="Root Mean Square Error" value={metrics?.performance.avg_rmse.toFixed(2) || '--'} unit="MWh" />
                  <StatCard label="Mean Abs. Percent Error" value={metrics?.performance.avg_mape.toFixed(2) || '--'} unit="%" />
                  <StatCard label="Ensemble Evaluations" value={metrics?.performance.n_evaluations || '--'} />
                </div>
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
            ) : <p className="text-text-muted">Failed to load metrics</p>}
          </GlassCard>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <GlassCard className="h-full bg-black/5 border-none shadow-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                <Icons.Brain className="w-5 h-5 text-text-primary" />
              </div>
              <h2 className="text-xl font-bold">The Optuna Ensemble</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Our forecasting engine is powered by an optimized Ensemble model. It dynamically weights the predictions of 
              <strong className="text-text-primary font-semibold"> CatBoost, XGBoost, and LightGBM</strong>. 
              We utilize Bayesian Optimization via Optuna to fine-tune the hyperparameters and ensemble weights, effectively 
              minimizing the Mean Absolute Error (MAE) and ensuring robustness across all seasons.
            </p>
          </GlassCard>
        </div>

        {/* =========================================================
            SECTION 3: SUPPORTING CONTEXT (OVERVIEW GRID)
            ========================================================= */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <GlassCard className="h-full">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icons.Calendar className="w-5 h-5" /> Data Splitting
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-sm text-text-secondary">Training Set</span>
                <span className="text-sm font-semibold text-text-primary bg-black/5 px-2 py-1 rounded">Dec 2016 – Jul 2020</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-sm text-text-secondary">Validation Set</span>
                <span className="text-sm font-semibold text-text-primary bg-black/5 px-2 py-1 rounded">Jul 2020 – Apr 2021</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-sm text-text-secondary">Test Set</span>
                <span className="text-sm font-semibold text-text-primary bg-black/5 px-2 py-1 rounded">Apr 2021 – Dec 2021</span>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <GlassCard className="h-full">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icons.Database className="w-5 h-5" /> Engineering & Cleaning
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Icons.CheckCircle2 className="w-4 h-4 text-text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Anomaly Detection:</strong> IQR-based flagging (2.5×) adds <code>is_anomaly</code> + z-score.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Icons.CheckCircle2 className="w-4 h-4 text-text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Missing Data:</strong> Hourly reindex + time-interpolation fills gaps.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Icons.CheckCircle2 className="w-4 h-4 text-text-primary mt-0.5 flex-shrink-0" />
                <span><strong>SHAP Selection:</strong> Top 30 features via blended SHAP + ensemble importance.</span>
              </li>
            </ul>
          </GlassCard>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <GlassCard className="h-full">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icons.Lightbulb className="w-5 h-5" /> Key EDA Insights
            </h2>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-black/5 border border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-1">🌅 Morning & Evening Peaks</h3>
                <p className="text-sm text-text-secondary">Clear morning (6–12h) and evening (17–22h) demand spikes driven by residential routines.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/5 border border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-1">📅 Holiday & Weekend Dip</h3>
                <p className="text-sm text-text-secondary">Weekdays carry a <strong className="text-text-primary">+6.68%</strong> premium over weekends.</p>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>
    </PageTransition>
  )
}
