import { useMutation } from '@tanstack/react-query'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { useTrainingStatus } from '@/hooks/useTrainingStatus'
import { api } from '@/api/endpoints'
import { formatTimestamp } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'

export default function Training() {
  const { data: status, refetch } = useTrainingStatus()
  const queryClient = useQueryClient()

  const trainMutation = useMutation({
    mutationFn: () => api.train({ retrain: false }),
    onSuccess: () => {
      toast.success('Training started!')
      queryClient.invalidateQueries({ queryKey: ['training-status'] })
    },
    onError: () => {
      toast.error('Training failed — check API')
    },
  })

  const mockHistory = [
    { date: '2026-05-04 00:54', duration: '~2m', status: 'completed', mae: 36.40, note: '+ is_holiday (AU) · SHAP blend' },
    { date: '2026-05-03 23:50', duration: '~2m', status: 'completed', mae: 36.57, note: '+ AU seasons · is_morning/evening' },
    { date: '2026-05-03 12:58', duration: '~8m', status: 'completed', mae: 28.33, note: 'Optuna 180-trial baseline' },
  ]

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6">
        {/* Status Card */}
        <div className="col-span-12 xl:col-span-4">
          <GlassCard className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Training Status</h2>
            <Badge
              variant={status?.training_in_progress ? 'warning' : 'online'}
              label={status?.training_in_progress ? 'Training...' : 'Ready'}
            />
          </div>

          {status?.last_training && (
            <p className="text-sm text-text-muted mb-4">Last trained: {formatTimestamp(status.last_training)}</p>
          )}

          {status?.training_in_progress && (
            <div className="mt-4 h-2 bg-black/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-brand rounded-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <motion.button
              onClick={() => trainMutation.mutate()}
              disabled={status?.training_in_progress || trainMutation.isPending}
              className="flex-1 px-6 py-2 bg-gradient-brand rounded-btn font-semibold text-white shadow-btn hover:shadow-btn-hover transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {trainMutation.isPending ? 'Starting...' : 'Start Training'}
            </motion.button>

            <motion.button
              onClick={() => refetch()}
              className="flex-1 px-6 py-2 bg-black/5 hover:bg-black/10 rounded-btn font-semibold text-text-secondary hover:text-text-primary transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Refresh Status
            </motion.button>
          </div>
          </GlassCard>
        </div>

        {/* Last Training Results */}
        <div className="col-span-12 xl:col-span-8">
          <GlassCard className="h-full">
            <h2 className="text-xl font-bold mb-6">Last Training Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Train Size" value="30,710" unit="samples" />
            <StatCard label="Val Size" value="6,581" unit="samples" />
            <StatCard label="Test Size" value="6,581" unit="samples" />
            <StatCard label="SHAP Features" value="30" unit="/ 72" />
          </div>

          {/* Model Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
            {[
              { name: 'XGBoost', mae: 37.20 },
              { name: 'LightGBM', mae: 39.78 },
              { name: 'CatBoost', mae: 42.78 },
              { name: 'Ensemble', mae: 36.40 },
            ].map((m) => (
              <GlassCard key={m.name} padding="sm" className="text-center">
                <p className="text-2xs text-text-muted uppercase tracking-widest">{m.name}</p>
                <p className="text-2xl font-black text-text-primary mt-2">{m.mae.toFixed(2)}</p>
                <p className="text-2xs text-text-faint mt-1">MAE (MWh)</p>
              </GlassCard>
            ))}
          </div>
        </GlassCard>
        </div>

        {/* Training History */}
        <div className="col-span-12">
          <GlassCard>
            <h2 className="text-xl font-bold mb-6">Training History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-text-muted font-semibold">Date & Time</th>
                  <th className="px-4 py-3 text-center text-text-muted font-semibold">Duration</th>
                  <th className="px-4 py-3 text-center text-text-muted font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-text-muted font-semibold">Changes</th>
                  <th className="px-4 py-3 text-right text-text-muted font-semibold">MAE (MWh)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockHistory.map((row, i) => (
                  <tr key={i} className="hover:bg-black/5 transition-colors">
                    <td className="px-4 py-3 text-text-secondary">{row.date}</td>
                    <td className="px-4 py-3 text-center text-text-secondary">{row.duration}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 text-success text-xs font-semibold">
                        <Icons.CheckCircle className="w-3 h-3" />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">{row.note ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary">{row.mae.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  )
}
