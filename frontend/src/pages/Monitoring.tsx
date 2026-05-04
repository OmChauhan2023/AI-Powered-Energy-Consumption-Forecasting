import * as Icons from 'lucide-react'
import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { MetricCard } from '@/components/ui/MetricCard'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { AlertItem } from '@/components/ui/AlertItem'
import { useMetrics } from '@/hooks/useMetrics'

export default function Monitoring() {
  const { data: metrics, isLoading } = useMetrics()
  const perf = metrics?.performance

  if (isLoading) {
    return (
      <PageTransition>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SkeletonCard count={4} />
        </div>
      </PageTransition>
    )
  }

  if (!perf) {
    return (
      <PageTransition>
        <GlassCard>
          <p className="text-text-muted">Failed to load monitoring data</p>
        </GlassCard>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6">
        {/* KPI Metrics */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label="Evaluations" value={perf.n_evaluations} unit="" icon={Icons.CheckCircle} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label="Avg MAE" value={perf.avg_mae} unit="MWh" icon={Icons.Target} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label="Avg RMSE" value={perf.avg_rmse} unit="MWh" icon={Icons.BarChart2} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label="Avg MAPE" value={perf.avg_mape} unit="%" icon={Icons.Percent} />
        </div>

        {/* Model Performance Table */}
        <div className="col-span-12 xl:col-span-8">
          <GlassCard className="h-full">
            <h2 className="text-xl font-bold mb-6">Model Performance Breakdown</h2>
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
                {Object.entries(perf.models).map(([name, m]) => (
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
          </GlassCard>
        </div>

        {/* Alerts */}
        <div className="col-span-12 xl:col-span-4">
          <GlassCard className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Alerts</h2>
              <Badge
                variant={metrics?.recent_alerts && metrics.recent_alerts.length > 0 ? 'warning' : 'online'}
                label={
                  metrics?.recent_alerts && metrics.recent_alerts.length > 0
                    ? `${metrics.recent_alerts.length} Alerts`
                    : 'No Alerts'
                }
              />
            </div>

            {metrics?.recent_alerts && metrics.recent_alerts.length === 0 ? (
              <p className="text-text-muted text-center py-8">No alerts at this time</p>
            ) : (
              <div className="space-y-2">
                {metrics?.recent_alerts?.slice(0, 10).map((alert, i) => <AlertItem key={i} alert={alert} />)}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Anomaly Detection Summary */}
        <div className="col-span-12 md:col-span-6">
          <GlassCard className="h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/5">
                <Icons.ShieldAlert className="w-5 h-5 text-text-primary" />
              </div>
              <h2 className="text-lg font-bold">Anomaly Detection Layer</h2>
            </div>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              IQR-based detection (2.5× multiplier) runs on every row before training.
              Flagged rows receive <code className="text-xs bg-black/5 px-1 py-0.5 rounded">is_anomaly = 1</code> and a <code className="text-xs bg-black/5 px-1 py-0.5 rounded">anomaly_z_score</code>.
              Rows are <strong className="text-text-primary">not removed</strong> — the model learns from them.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Flagged Rows', value: '0', sub: 'data is clean' },
                { label: 'IQR Multiplier', value: '2.5×', sub: 'threshold' },
                { label: 'Method', value: 'IQR', sub: '+ Z-score' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl bg-black/5 text-center">
                  <p className="text-lg font-black text-text-primary">{s.value}</p>
                  <p className="text-2xs text-text-muted uppercase tracking-wider mt-1">{s.label}</p>
                  <p className="text-2xs text-text-faint">{s.sub}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* SHAP Top Features */}
        <div className="col-span-12 md:col-span-6">
          <GlassCard className="h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/5">
                <Icons.Sparkles className="w-5 h-5 text-text-primary" />
              </div>
              <h2 className="text-lg font-bold">SHAP Top 10 Features</h2>
              <span className="ml-auto text-xs text-text-muted">blended importance · 30 of 72 selected</span>
            </div>
            <div className="space-y-2">
              {[
                { name: 'lag_1h',          score: 0.4755 },
                { name: 'covid_deviation', score: 0.1025 },
                { name: 'lag_2h',          score: 0.0689 },
                { name: 'lag_24h',         score: 0.0512 },
                { name: 'hour',            score: 0.0393 },
                { name: 'hour_cos',        score: 0.0324 },
                { name: 'hour_sin',        score: 0.0219 },
                { name: 'lag_8736h',       score: 0.0211 },
                { name: 'day_of_week',     score: 0.0207 },
                { name: 'lag_168h',        score: 0.0138 },
              ].map((f, i) => (
                <div key={f.name} className="flex items-center gap-3">
                  <span className="text-2xs text-text-faint w-4 text-right">{i + 1}</span>
                  <span className="text-sm font-mono text-text-secondary flex-1">{f.name}</span>
                  <div className="w-32 h-2 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-brand rounded-full"
                      style={{ width: `${(f.score / 0.4755) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted w-12 text-right">{f.score.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  )
}
