import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { MetricCard } from '@/components/ui/MetricCard'
import { ScenarioButton } from '@/components/ui/ScenarioButton'
import { SliderField } from '@/components/ui/SliderField'
import { ForecastChart } from '@/components/charts/ForecastChart'
import { ModelComparisonChart } from '@/components/charts/ModelComparisonChart'
import { api } from '@/api/endpoints'
import { SCENARIOS } from '@/lib/constants'
import { hourLabel, dayLabel, monthLabel } from '@/lib/utils'
import type { PredictionFeatures, PredictionResponse } from '@/api/types'

export default function PredictionEngine() {
  // --- FORECAST STATE ---
  const [horizon, setHorizon] = useState(24)
  const [forecastResult, setForecastResult] = useState<any>(null)

  const forecastMutation = useMutation({
    mutationFn: () => api.forecast({ horizon }),
    onSuccess: (data) => {
      setForecastResult(data)
      toast.success(`${data.horizon}h forecast generated!`)
    },
    onError: () => toast.error('Forecast failed — check API connection'),
  })

  const forecastStats = forecastResult && forecastResult.forecasts.length > 0 ? {
    max: Math.max(...forecastResult.forecasts),
    min: Math.min(...forecastResult.forecasts),
    mean: forecastResult.forecasts.reduce((a: number, b: number) => a + b, 0) / forecastResult.forecasts.length,
    std: Math.sqrt(forecastResult.forecasts.reduce((a: number, v: number, _i: number, arr: any[]) => 
      a + Math.pow(v - arr.reduce((x: number, y: number) => x + y) / arr.length, 2), 0) / forecastResult.forecasts.length),
  } : null

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

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6">
        
        {/* =========================================================
            SECTION 1: FORECAST HORIZON (TOP)
            ========================================================= */}
        <div className="col-span-12 xl:col-span-8">
          <GlassCard className="h-full">
            <h2 className="text-xl font-bold mb-6">Long-Term Horizon Generator</h2>
            <SliderField
              label={`${horizon} Hours Ahead`}
              min={1} max={168} value={horizon}
              onChange={setHorizon} formatLabel={(v) => `${v} hours`}
            />
            <div className="flex gap-3 mt-6">
              {[24, 48, 168].map(h => (
                <motion.button key={h} onClick={() => setHorizon(h)}
                  className="flex-1 px-4 py-2 rounded-btn bg-black/5 hover:bg-black/10 text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                >
                  {h === 168 ? '7 Days' : `${h} Hours`}
                </motion.button>
              ))}
            </div>
            <motion.button
              onClick={() => forecastMutation.mutate()} disabled={forecastMutation.isPending}
              className="w-full mt-6 px-8 py-3 bg-gradient-brand rounded-btn font-bold text-white shadow-btn hover:shadow-btn-hover transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              {forecastMutation.isPending ? 'Generating...' : `Generate ${horizon}h Forecast`}
            </motion.button>
          </GlassCard>
        </div>

        <div className="col-span-12 xl:col-span-4 grid grid-cols-2 gap-3 content-start">
          <StatCard label="Max" value={forecastStats?.max.toFixed(1) ?? '--'} unit="MWh" />
          <StatCard label="Min" value={forecastStats?.min.toFixed(1) ?? '--'} unit="MWh" />
          <StatCard label="Mean" value={forecastStats?.mean.toFixed(1) ?? '--'} unit="MWh" />
          <StatCard label="Std" value={forecastStats?.std.toFixed(1) ?? '--'} unit="MWh" />
        </div>

        {forecastResult && (
          <div className="col-span-12 mb-8">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard>
                <h2 className="text-xl font-bold mb-4">Forecast with Uncertainty Band</h2>
                <ForecastChart forecasts={forecastResult.forecasts} uncertainties={forecastResult.uncertainties} />
              </GlassCard>
            </motion.div>
          </div>
        )}

        <div className="col-span-12 border-b border-border my-4" />

        {/* =========================================================
            SECTION 2: SINGLE HOUR SIMULATOR (BOTTOM)
            ========================================================= */}
        <div className="col-span-12 mb-2">
          <h2 className="text-2xl font-bold">What-If Scenarios & Feature Probing</h2>
          <p className="text-text-secondary mt-1">Isolate specific hours and conditions to see exactly how the ensemble reacts.</p>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <GlassCard className="h-full">
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
              {predictMutation.isPending ? 'Predicting...' : 'Run Prediction'}
            </motion.button>
          </GlassCard>
        </div>

        {predictionResult && (
          <div className="col-span-12 mt-2">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 content-start">
                <MetricCard label="Ensemble" value={predictionResult.prediction} unit="MWh" icon={Icons.Brain} />
                <MetricCard label="Uncertainty" value={predictionResult.uncertainty} unit="±MWh" icon={Icons.AlertCircle} />
                <MetricCard label="XGBoost" value={predictionResult.xgb_pred} unit="MWh" icon={Icons.Cpu} />
                <MetricCard label="LightGBM" value={predictionResult.lgb_pred} unit="MWh" icon={Icons.Cpu} />
              </div>
              <div className="col-span-12 xl:col-span-8">
                <GlassCard className="h-full">
                  <h2 className="text-xl font-bold mb-4">Model Comparison</h2>
                  <ModelComparisonChart result={predictionResult} />
                </GlassCard>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </PageTransition>
  )
}
