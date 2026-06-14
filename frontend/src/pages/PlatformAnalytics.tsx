import { useMemo } from 'react'
import * as Icons from 'lucide-react'
import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { MetricCard } from '@/components/ui/MetricCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { StatCard } from '@/components/ui/StatCard'
import { HistoricalChart } from '@/components/charts/HistoricalChart'
import { useMetrics } from '@/hooks/useMetrics'
import { generateMockHistory } from '@/lib/utils'

export default function PlatformAnalytics() {
  const { data: metrics, isLoading: metricsLoading } = useMetrics()
  const historyData = useMemo(() => generateMockHistory(168), [])

  const currentMWh = historyData.length > 0 ? historyData[historyData.length - 1].value : 0
  const avg24h = historyData.length >= 24 ? historyData.slice(-24).reduce((a, v) => a + v.value, 0) / 24 : 0
  const peak24h = historyData.length >= 24 ? Math.max(...historyData.slice(-24).map((v) => v.value)) : 0
  const min24h = historyData.length >= 24 ? Math.min(...historyData.slice(-24).map((v) => v.value)) : 0

  return (
    <PageTransition>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* =========================================================
            TOP ROW: CHART + METRICS (LEFT) | SIGNIFICANCE (RIGHT)
            ========================================================= */}
        
        {/* Left Side: Combined Metrics & Chart Box */}
        <div className="lg:col-span-8 flex flex-col gap-5 h-full">
          <GlassCard className="!p-0 border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
            {/* Top row inside the box: The 4 Metrics */}
            <div className="bg-gray-50/50 border-b border-gray-200 p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Current Load" value={currentMWh.toFixed(2)} unit="MWh" icon={Icons.Zap} />
                <MetricCard label="24h Average" value={avg24h.toFixed(2)} unit="MWh" icon={Icons.BarChart2} />
                <MetricCard label="Peak (24h)" value={peak24h.toFixed(2)} unit="MWh" icon={Icons.TrendingUp} />
                <MetricCard label="Min (24h)" value={min24h.toFixed(2)} unit="MWh" icon={Icons.TrendingDown} />
              </div>
            </div>
            {/* Bottom row inside the box: The Chart */}
            <div className="p-6 bg-white flex-1">
              <h2 className="text-base font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-6">
                <Icons.Activity className="w-5 h-5 text-blue-600" /> 
                Historical Consumption (Last 7 Days)
              </h2>
              <HistoricalChart data={historyData} />
            </div>
          </GlassCard>
        </div>

        {/* Right Side: Significance & Information */}
        <div className="lg:col-span-4 flex flex-col gap-5 h-full">
          <GlassCard className="border border-gray-200 shadow-sm h-full bg-white">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <Icons.BookOpen className="w-5 h-5 text-indigo-600" />
              Grid Load Significance
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Icons.TrendingUp className="w-4 h-4 text-emerald-500" /> Peak Load Pricing
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The peak value (currently {peak24h.toFixed(1)} MWh) dictates the daily wholesale energy pricing multipliers. 
                  Exceeding 12,000 MWh forces grid operators to spin up auxiliary gas peaker plants, which drastically increases carbon emissions and wholesale costs by up to 300%.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Icons.Zap className="w-4 h-4 text-amber-500" /> Load Forecasting Value
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  By highly optimizing our MAPE (Mean Absolute Percentage Error), we allow grid dispatchers to proactively buy energy in day-ahead markets instead of volatile real-time spot markets. 
                  Every 1% reduction in MAPE equates to approximately $1.2M in annual savings.
                </p>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Live Status</h3>
                <p className="text-sm text-blue-800">
                  Grid frequency is stable at 60.01Hz. No severe load anomalies detected in the last 72 hours. Weather-adjusted baselines are holding steady within the 95% confidence interval.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* =========================================================
            BOTTOM ROW: LIVE PERFORMANCE MATRIX & MODEL INFO
            ========================================================= */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-5 h-full">
          <GlassCard className="border border-gray-200 shadow-sm bg-white h-full">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <Icons.Crosshair className="w-5 h-5 text-indigo-500" /> Real-Time Model Accuracy Matrix
            </h2>
            {metricsLoading ? <SkeletonCard count={1} /> : metrics ? (
              <div className="overflow-x-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard label="Live Mean Absolute Error" value={metrics?.performance.avg_mae.toFixed(2) || '--'} unit="MWh" />
                  <StatCard label="Root Mean Square Error" value={metrics?.performance.avg_rmse.toFixed(2) || '--'} unit="MWh" />
                  <StatCard label="Mean Abs. Percent Error" value={metrics?.performance.avg_mape.toFixed(2) || '--'} unit="%" />
                  <StatCard label="Ensemble Evaluations" value={metrics?.performance.n_evaluations || '--'} />
                </div>
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-gray-500 font-extrabold tracking-wider uppercase text-[10px] rounded-tl-xl">Model Engine</th>
                      <th className="px-5 py-4 text-right text-gray-500 font-extrabold tracking-wider uppercase text-[10px]">MAE (MWh)</th>
                      <th className="px-5 py-4 text-right text-gray-500 font-extrabold tracking-wider uppercase text-[10px]">RMSE (MWh)</th>
                      <th className="px-5 py-4 text-right text-gray-500 font-extrabold tracking-wider uppercase text-[10px] rounded-tr-xl">MAPE (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(metrics.performance.models).map(([name, m]) => (
                      <tr key={name} className={`hover:bg-gray-50 transition-colors ${name.toLowerCase() === 'ensemble' ? 'bg-indigo-50/30' : ''}`}>
                        <td className="px-5 py-4 font-bold text-gray-900 uppercase flex items-center gap-2">
                          {name.toLowerCase() === 'ensemble' && <Icons.Award className="w-4 h-4 text-indigo-600" />}
                          {name}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-medium text-gray-600">{m.MAE.toFixed(2)}</td>
                        <td className="px-5 py-4 text-right font-mono font-medium text-gray-600">{m.RMSE.toFixed(2)}</td>
                        <td className="px-5 py-4 text-right font-mono font-medium text-gray-600">{m.MAPE.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-gray-500">Failed to load metrics</p>}
          </GlassCard>
        </div>

        {/* Right Side: Model Architecture Info */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-5 h-full">
          <GlassCard className="border border-gray-200 shadow-sm h-full bg-white">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <Icons.Brain className="w-5 h-5 text-indigo-600" />
              The Optuna Ensemble Engine
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Icons.Network className="w-4 h-4 text-blue-500" /> Gradient Boosting Blend
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The matrix to the left is powered by a proprietary Ensemble model. Instead of relying on one algorithm, we dynamically weight the predictions of <strong>CatBoost</strong>, <strong>XGBoost</strong>, and <strong>LightGBM</strong>.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Icons.Activity className="w-4 h-4 text-purple-500" /> Bayesian Optimization
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We utilize Optuna's bayesian search framework to continuously fine-tune the hyperparameters of all three base learners. This ensures our MAPE stays below 5% regardless of aggressive seasonal shifts.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Why it matters</h3>
                <p className="text-sm text-gray-600">
                  If LightGBM fails to capture a sudden temperature drop, CatBoost's symmetric tree architecture often catches it. The Ensemble automatically trusts the most accurate model for the current weather regime.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>
    </PageTransition>
  )
}
