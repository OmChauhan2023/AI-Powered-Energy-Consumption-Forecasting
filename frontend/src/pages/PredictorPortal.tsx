import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { MetricCard } from '@/components/ui/MetricCard'
import { ScenarioButton } from '@/components/ui/ScenarioButton'
import { SliderField } from '@/components/ui/SliderField'
import { ModelComparisonChart } from '@/components/charts/ModelComparisonChart'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { WeatherPanel } from '@/components/ui/WeatherPanel'
import { useCost } from '@/contexts/CostContext'
import { api } from '@/api/endpoints'
import { SCENARIOS } from '@/lib/constants'
import { hourLabel, dayLabel, monthLabel, cn } from '@/lib/utils'
import type { PredictionFeatures, PredictionResponse } from '@/api/types'

export default function PredictorPortal() {
  const { isCostMode, rate } = useCost()
  
  // --- PREDICTIONS STATE ---
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [features, setFeatures] = useState<PredictionFeatures>({
    hour: 12, day_of_week: 2, month: 1, is_weekend: 0,
    lag_24h: 120, lag_12h: 118, roll_mean_24h: 125, roll_std_24h: 4,
  })
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null)

  const predictMutation = useMutation({
    mutationFn: () => api.predict({ data: features, model: 'ensemble' }),
    onSuccess: (data) => {
      setPredictionResult(data)
      toast.success('Prediction complete!')
    },
    onError: () => toast.error('Prediction failed — check API connection'),
  })

  const updateFeature = (key: keyof PredictionFeatures, value: number) => setFeatures((prev) => ({ ...prev, [key]: value }))
  const handleScenario = (key: string) => {
    setSelectedScenario(key)
    setFeatures(SCENARIOS[key].features)
  }

  const handleDownloadReport = async () => {
    if (!predictionResult) return
    const loadingToast = toast.loading('Generating AI Report...')
    try {
      const blob = await api.generateReport({ data: { ...predictionResult, features } })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Energy_Forecast_Report_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Report downloaded!', { id: loadingToast })
    } catch {
      toast.error('Failed to generate report', { id: loadingToast })
    }
  }

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6 relative">
        <ChatWidget context={{ predictionResult, features }} />
        
        {/* =========================================================
            HEADER & DESCRIPTION
            ========================================================= */}
        <div className="col-span-12">
          <div className="mb-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Enterprise Predictor Engine</h1>
            <p className="text-text-secondary mt-2 max-w-3xl leading-relaxed">
              Welcome to the Nexus AI Predictor. This tool allows you to isolate specific hours and conditions to see exactly how our ensemble models react. Use the custom configuration to probe specific scenarios, and view the Explainable AI (XAI) breakdown to understand the primary drivers behind energy demand.
            </p>
          </div>
        </div>

        {/* =========================================================
            SINGLE HOUR SIMULATOR (TOP ROW)
            ========================================================= */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          <WeatherPanel />
          <GlassCard className="flex-1">
            <h2 className="text-xl font-bold mb-4">Quick Scenarios</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(SCENARIOS).map(([key, scenario]) => (
                <ScenarioButton key={key} label={scenario.label} icon={scenario.icon}
                  isActive={selectedScenario === key} onClick={() => handleScenario(key)}
                />
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="col-span-12 xl:col-span-8">
          <GlassCard className="h-full">
            <h2 className="text-xl font-bold mb-6">Custom Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SliderField label="Hour of Day" min={0} max={23} value={features.hour} onChange={(v) => updateFeature('hour', v)} formatLabel={hourLabel} />
              <SliderField label="Day of Week" min={0} max={6} value={features.day_of_week} onChange={(v) => updateFeature('day_of_week', v)} formatLabel={dayLabel} />
              <SliderField label="Month" min={1} max={12} value={features.month} onChange={(v) => updateFeature('month', v)} formatLabel={monthLabel} />
              <SliderField label="Is Weekend" min={0} max={1} value={features.is_weekend} onChange={(v) => updateFeature('is_weekend', v)} formatLabel={(v) => (v === 0 ? 'Weekday' : 'Weekend')} />
              <SliderField label="Lag 24h (MWh)" min={80} max={160} step={0.5} value={features.lag_24h} onChange={(v) => updateFeature('lag_24h', v)} />
              <SliderField label="Lag 12h (MWh)" min={80} max={160} step={0.5} value={features.lag_12h} onChange={(v) => updateFeature('lag_12h', v)} />
              <SliderField label="Roll Mean 24h (MWh)" min={80} max={160} step={0.5} value={features.roll_mean_24h} onChange={(v) => updateFeature('roll_mean_24h', v)} />
              <SliderField label="Roll Std 24h (MWh)" min={1} max={10} step={0.1} value={features.roll_std_24h} onChange={(v) => updateFeature('roll_std_24h', v)} />
            </div>
            <motion.button onClick={() => predictMutation.mutate()} disabled={predictMutation.isPending}
              className="mt-8 w-full px-8 py-3 bg-gradient-brand rounded-btn font-bold text-white shadow-btn hover:shadow-btn-hover transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              {predictMutation.isPending ? 'Predicting...' : 'Run AI Prediction'}
            </motion.button>
          </GlassCard>
        </div>

        {/* =========================================================
            RESULTS & EXPLAINABLE AI
            ========================================================= */}
        {predictionResult && (
          <div className="col-span-12 mt-2">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-12 gap-6">
              
              {/* Header with Export */}
              <div className="col-span-12 flex justify-between items-center bg-white p-4 rounded-xl border border-border shadow-sm">
                <h2 className="text-xl font-bold">Prediction Results</h2>
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Icons.Download className="w-4 h-4" />
                  Export Detailed PDF Report
                </button>
              </div>

              {/* Metrics */}
              <div className="col-span-12 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 content-start">
                <MetricCard label="Ensemble" value={isCostMode ? predictionResult.prediction * rate : predictionResult.prediction} unit={isCostMode ? "AUD" : "MWh"} icon={Icons.Brain} />
                <MetricCard label="Uncertainty" value={isCostMode ? predictionResult.uncertainty * rate : predictionResult.uncertainty} unit={isCostMode ? "±AUD" : "±MWh"} icon={Icons.AlertCircle} />
                <MetricCard label="XGBoost" value={isCostMode ? predictionResult.xgb_pred * rate : predictionResult.xgb_pred} unit={isCostMode ? "AUD" : "MWh"} icon={Icons.Cpu} />
                <MetricCard label="LightGBM" value={isCostMode ? predictionResult.lgb_pred * rate : predictionResult.lgb_pred} unit={isCostMode ? "AUD" : "MWh"} icon={Icons.Cpu} />
              </div>

              {/* Chart */}
              <div className="col-span-12 xl:col-span-8">
                <GlassCard className="h-full">
                  <h2 className="text-xl font-bold mb-4">Model Comparison</h2>
                  <ModelComparisonChart result={predictionResult} />
                </GlassCard>
              </div>

              {/* Explainable AI Breakdown */}
              {predictionResult.feature_contributions && (
                <div className="col-span-12">
                  <GlassCard>
                    <div className="flex items-center gap-2 mb-4">
                      <Icons.Search className="w-5 h-5 text-blue-600" />
                      <h2 className="text-xl font-bold">Why did this happen? (Explainable AI)</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(predictionResult.feature_contributions).map(([feature, impact]) => (
                        <div key={feature} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col">
                          <span className="text-sm text-text-muted uppercase tracking-wider font-semibold mb-2">{feature}</span>
                          <div className="flex items-end gap-2 mt-auto">
                            <span className={cn(
                              "text-xl font-black",
                              impact > 0 ? "text-red-500" : "text-green-500"
                            )}>
                              {impact > 0 ? '+' : ''}{impact.toFixed(1)}
                            </span>
                            <span className="text-sm text-text-secondary pb-1">MWh impact</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              )}

            </motion.div>
          </div>
        )}

      </div>
    </PageTransition>
  )
}
