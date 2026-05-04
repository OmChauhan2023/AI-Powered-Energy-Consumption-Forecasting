import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { SliderField } from '@/components/ui/SliderField'
import { Badge } from '@/components/ui/Badge'
import { useHealth } from '@/hooks/useHealth'
import { settingsStore } from '@/store/settingsStore'
import { api } from '@/api/endpoints'
import { formatTimestamp } from '@/lib/utils'

export default function Settings() {
  const { data: health } = useHealth()
  const [localApiUrl, setLocalApiUrl] = useState(settingsStore.getState().apiUrl)
  const [connectionStatus, setConnectionStatus] = useState<'ok' | 'fail' | null>(null)
  const refreshInterval = settingsStore((s) => s.refreshInterval)
  const setRefreshInterval = settingsStore((s) => s.setRefreshInterval)

  const testMutation = useMutation({
    mutationFn: api.getHealth,
    onSuccess: () => {
      setConnectionStatus('ok')
      toast.success('Connected!')
    },
    onError: () => {
      setConnectionStatus('fail')
      toast.error('Connection failed')
    },
  })

  const handleSaveUrl = () => {
    settingsStore.setState({ apiUrl: localApiUrl })
    toast.success('API URL saved!')
  }

  return (
    <PageTransition>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Configuration */}
        <GlassCard>
          <h2 className="text-xl font-bold mb-6">API Configuration</h2>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-text-secondary mb-2">API Base URL</label>
            <input
              type="text"
              value={localApiUrl}
              onChange={(e) => {
                setLocalApiUrl(e.target.value)
                setConnectionStatus(null)
              }}
              className="w-full bg-black/5 border border-border rounded-btn px-4 py-2 text-text-primary focus:border-brand-from focus:outline-none transition-colors"
              placeholder="http://localhost:8000"
            />
          </div>

          <div className="flex gap-3 mb-4">
            <motion.button
              onClick={handleSaveUrl}
              className="flex-1 px-4 py-2 bg-gradient-brand rounded-btn font-semibold text-white shadow-btn hover:shadow-btn-hover transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Save URL
            </motion.button>

            <motion.button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="flex-1 px-4 py-2 bg-black/5 hover:bg-black/10 rounded-btn font-semibold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {testMutation.isPending ? 'Testing...' : 'Test Connection'}
            </motion.button>
          </div>

          {connectionStatus && (
            <Badge
              variant={connectionStatus === 'ok' ? 'online' : 'offline'}
              label={connectionStatus === 'ok' ? 'Connected' : 'Cannot Connect'}
            />
          )}
        </GlassCard>

        {/* Display Settings */}
        <GlassCard>
          <h2 className="text-xl font-bold mb-6">Display Settings</h2>

          <SliderField
            label={`Refresh Interval: ${refreshInterval}s`}
            min={5}
            max={120}
            value={refreshInterval}
            onChange={setRefreshInterval}
            formatLabel={(v) => `${v}s`}
          />

          <p className="text-text-muted text-xs mt-3">
            Controls how often health status and metrics are polled from the API.
          </p>
        </GlassCard>

        {/* System Information */}
        <GlassCard>
          <h2 className="text-xl font-bold mb-6">System Information</h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-muted">API Version</span>
              <span className="text-sm font-semibold text-text-primary">{health?.version ?? '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-muted">Models Loaded</span>
              <span className="text-sm font-semibold text-text-primary">{health?.models_loaded ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-muted">Data Available</span>
              <span className="text-sm font-semibold text-text-primary">{health?.data_path_exists ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-text-muted">Last Training</span>
              <span className="text-sm font-semibold text-text-primary">{formatTimestamp(health?.last_training ?? null)}</span>
            </div>
          </div>
        </GlassCard>

        {/* Enabled Features */}
        <GlassCard>
          <h2 className="text-xl font-bold mb-6">Enabled Features</h2>

          <div className="space-y-2">
            {[
              'Real-time predictions',
              'Multi-step forecasting',
              'Ensemble models',
              'Performance monitoring',
              '30s health polling',
              'Animated metrics',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 py-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm text-text-secondary">{feature}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  )
}
