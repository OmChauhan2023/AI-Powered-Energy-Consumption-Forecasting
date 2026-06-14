import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { SliderField } from '@/components/ui/SliderField'
import { Badge } from '@/components/ui/Badge'
import ReactECharts from 'echarts-for-react'
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
      toast.success('Control Plane Connected!')
    },
    onError: () => {
      setConnectionStatus('fail')
      toast.error('Connection failed to backend')
    },
  })

  const handleSaveUrl = () => {
    settingsStore.setState({ apiUrl: localApiUrl })
    toast.success('API Gateway URL saved!')
  }

  // Animation Variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }
  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  // 1. Live API Latency Chart (Simulated)
  const [pingData, setPingData] = useState<number[]>(Array(20).fill(45))
  useEffect(() => {
    if (connectionStatus !== 'ok') return;
    const interval = setInterval(() => {
      setPingData(prev => {
        const newPing = 40 + Math.random() * 15 + (Math.random() > 0.9 ? 30 : 0) // baseline + noise + random spike
        return [...prev.slice(1), parseFloat(newPing.toFixed(0))]
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [connectionStatus])

  const latencyOptions = {
    tooltip: { trigger: 'axis', formatter: 'Latency: {c} ms' },
    grid: { left: '2%', right: '2%', bottom: '5%', top: '5%', containLabel: false },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: Array(20).fill('') },
    yAxis: { type: 'value', min: 0, max: 120, show: false },
    series: [
      {
        type: 'line',
        data: pingData,
        lineStyle: { color: connectionStatus === 'ok' ? '#10b981' : '#94a3b8', width: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: connectionStatus === 'ok' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.4)' }, 
              { offset: 1, color: 'rgba(255,255,255,0)' }
            ]
          }
        },
        symbol: 'none'
      }
    ]
  }

  // 2. Agent Resource Allocation Radar
  const resourceOptions = {
    tooltip: {},
    radar: {
      indicator: [
        { name: 'Compute (CPU)', max: 100 },
        { name: 'Memory (RAM)', max: 100 },
        { name: 'Storage (I/O)', max: 100 },
        { name: 'Network', max: 100 }
      ],
      axisName: { color: '#64748b', fontSize: 10 },
      radius: '60%',
      center: ['50%', '50%']
    },
    series: [{
      type: 'radar',
      data: [
        { value: [40, 80, 90, 20], name: 'DataAgent', itemStyle: { color: '#3b82f6' } },
        { value: [95, 85, 40, 10], name: 'TrainingAgent', itemStyle: { color: '#8b5cf6' } },
        { value: [60, 40, 10, 80], name: 'InferenceAgent', itemStyle: { color: '#f59e0b' } },
        { value: [20, 30, 60, 40], name: 'MonitoringAgent', itemStyle: { color: '#10b981' } }
      ]
    }]
  }

  return (
    <PageTransition>
      <motion.div 
        className="grid grid-cols-12 gap-6 items-start"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        {/* API CONFIGURATION & LIVE FEED */}
        <motion.div variants={itemVars} className="col-span-12 lg:col-span-7 h-full">
          <GlassCard className="h-full border border-gray-200 shadow-sm bg-white p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <Icons.Server className="w-5 h-5 text-indigo-500" /> API Gateway Configuration
              </h2>
              {connectionStatus && (
                <Badge
                  variant={connectionStatus === 'ok' ? 'online' : 'offline'}
                  label={connectionStatus === 'ok' ? 'Gateway Connected' : 'Connection Failed'}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Endpoint URL</label>
                <input
                  type="text"
                  value={localApiUrl}
                  onChange={(e) => {
                    setLocalApiUrl(e.target.value)
                    setConnectionStatus(null)
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-gray-900 font-mono text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                  placeholder="http://localhost:8000"
                />
                <div className="flex gap-3 mt-4">
                  <motion.button
                    onClick={handleSaveUrl}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 rounded-lg font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Update Route
                  </motion.button>
                  <motion.button
                    onClick={() => testMutation.mutate()}
                    disabled={testMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg font-bold text-gray-700 transition-colors text-sm disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {testMutation.isPending ? 'Pinging...' : 'Test Ping'}
                  </motion.button>
                </div>
              </div>

              {/* LIVE LATENCY MONITOR */}
              <div className="bg-slate-900 rounded-xl p-4 relative overflow-hidden flex flex-col justify-end">
                <div className="absolute top-3 left-3 z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connectionStatus === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-[10px] text-slate-300 font-bold tracking-widest uppercase">Live Latency</span>
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    {connectionStatus === 'ok' ? `${pingData[pingData.length - 1]}ms` : '-- ms'}
                  </div>
                </div>
                <div className="absolute inset-0 top-10 opacity-80">
                  <ReactECharts option={latencyOptions} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* AGENT RESOURCE ALLOCATION */}
        <motion.div variants={itemVars} className="col-span-12 lg:col-span-5 h-full">
          <GlassCard className="h-full border border-gray-200 shadow-sm bg-white p-5">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <Icons.Cpu className="w-5 h-5 text-blue-500" /> Sub-Agent Resource Map
            </h2>
            <div className="h-[220px]">
              <ReactECharts option={resourceOptions} style={{ height: '100%', width: '100%' }} />
            </div>
          </GlassCard>
        </motion.div>

        {/* SYSTEM INFORMATION MATRIX */}
        <motion.div variants={itemVars} className="col-span-12 lg:col-span-6 h-full">
          <GlassCard className="h-full border border-gray-200 shadow-sm bg-white p-5 flex flex-col">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <Icons.Info className="w-5 h-5 text-violet-500" /> Fast-API System Diagnostics
            </h2>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Icons.Code2 className="w-5 h-5 text-slate-400 mb-2" />
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">API Version</p>
                <p className="text-sm font-black text-slate-900">{health?.version ?? 'Offline'}</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <Icons.Database className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Storage Link</p>
                <p className="text-sm font-black text-blue-900">{health?.data_path_exists ? 'Verified' : 'Unreachable'}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <Icons.BrainCircuit className="w-5 h-5 text-emerald-400 mb-2" />
                <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Ensemble Models</p>
                <p className="text-sm font-black text-emerald-900">{health?.models_loaded ? 'Loaded into VRAM' : 'Unloaded'}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <Icons.Clock className="w-5 h-5 text-amber-400 mb-2" />
                <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Last Sync</p>
                <p className="text-sm font-black text-amber-900">{health?.last_training ? formatTimestamp(health?.last_training) : 'N/A'}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* CONTROLS & FEATURES */}
        <motion.div variants={itemVars} className="col-span-12 lg:col-span-6 h-full flex flex-col gap-6">
          <GlassCard className="border border-gray-200 shadow-sm bg-white p-5">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <Icons.Settings2 className="w-5 h-5 text-emerald-500" /> UI Telemetry Controls
            </h2>
            <div className="mt-2">
              <SliderField
                label={`Diagnostic Polling Rate: ${refreshInterval}s`}
                min={5}
                max={60}
                value={refreshInterval}
                onChange={setRefreshInterval}
                formatLabel={(v) => `${v}s`}
              />
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Controls the frequency at which the frontend dashboard polls the FastAPI backend for real-time drift, predictions, and anomaly status.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="flex-1 border border-gray-200 shadow-sm bg-white p-5">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <Icons.ShieldCheck className="w-5 h-5 text-emerald-500" /> Active Subsystems
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2">
              {[
                'Real-time Inference',
                '72-hr Forecasting',
                'Optuna Tuner Engine',
                'KS-Test Drift Monitor',
                'SHAP Explainability',
                'L-BFGS-B Weight Optimizer'
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Icons.CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

      </motion.div>
    </PageTransition>
  )
}
