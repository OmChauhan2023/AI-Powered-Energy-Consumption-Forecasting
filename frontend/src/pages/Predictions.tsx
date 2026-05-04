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
import { api } from '@/api/endpoints'
import { SCENARIOS } from '@/lib/constants'
import { hourLabel, dayLabel, monthLabel } from '@/lib/utils'
import type { PredictionFeatures, PredictionResponse } from '@/api/types'

export default function Predictions() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [features, setFeatures] = useState<PredictionFeatures>({
    hour: 12,
    day_of_week: 2,
    month: 1,
    is_weekend: 0,
    lag_24h: 120,
    lag_12h: 118,
    roll_mean_24h: 125,
    roll_std_24h: 4,
  })
  const [result, setResult] = useState<PredictionResponse | null>(null)

  const predictMutation = useMutation({
    mutationFn: () => api.predict({ data: features, model: 'ensemble' }),
    onSuccess: (data) => {
      setResult(data)
      toast.success('Prediction complete!')
    },
    onError: () => {
      toast.error('Prediction failed — check API connection')
    },
  })

  const updateFeature = (key: keyof PredictionFeatures, value: number) => {
    setFeatures((prev) => ({ ...prev, [key]: value }))
  }

  const handleScenario = (scenarioKey: string) => {
    const scenario = SCENARIOS[scenarioKey]
    setSelectedScenario(scenarioKey)
    setFeatures(scenario.features)
  }

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6">
        {/* Scenario Buttons */}
        <div className="col-span-12 xl:col-span-4">
          <GlassCard className="h-full">
            <h2 className="text-xl font-bold mb-4">Quick Scenarios</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(SCENARIOS).map(([key, scenario]) => (
                <ScenarioButton
                  key={key}
                  label={scenario.label}
                  icon={scenario.icon}
                  isActive={selectedScenario === key}
                  onClick={() => handleScenario(key)}
                />
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Feature Sliders */}
        <div className="col-span-12 xl:col-span-8">
          <GlassCard className="h-full">
            <h2 className="text-xl font-bold mb-6">Custom Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SliderField
                label="Hour of Day"
                min={0}
                max={23}
                value={features.hour}
                onChange={(v) => updateFeature('hour', v)}
                formatLabel={hourLabel}
              />
              <SliderField
                label="Day of Week"
                min={0}
                max={6}
                value={features.day_of_week}
                onChange={(v) => updateFeature('day_of_week', v)}
                formatLabel={dayLabel}
              />
              <SliderField
                label="Month"
                min={1}
                max={12}
                value={features.month}
                onChange={(v) => updateFeature('month', v)}
                formatLabel={monthLabel}
              />
              <SliderField
                label="Is Weekend"
                min={0}
                max={1}
                value={features.is_weekend}
                onChange={(v) => updateFeature('is_weekend', v)}
                formatLabel={(v) => (v === 0 ? 'Weekday' : 'Weekend')}
              />
              <SliderField
                label="Lag 24h (MWh)"
                min={80}
                max={160}
                step={0.5}
                value={features.lag_24h}
                onChange={(v) => updateFeature('lag_24h', v)}
              />
              <SliderField
                label="Lag 12h (MWh)"
                min={80}
                max={160}
                step={0.5}
                value={features.lag_12h}
                onChange={(v) => updateFeature('lag_12h', v)}
              />
              <SliderField
                label="Roll Mean 24h (MWh)"
                min={80}
                max={160}
                step={0.5}
                value={features.roll_mean_24h}
                onChange={(v) => updateFeature('roll_mean_24h', v)}
              />
              <SliderField
                label="Roll Std 24h (MWh)"
                min={1}
                max={10}
                step={0.1}
                value={features.roll_std_24h}
                onChange={(v) => updateFeature('roll_std_24h', v)}
              />
            </div>

            <motion.button
              onClick={() => predictMutation.mutate()}
              disabled={predictMutation.isPending}
              className="mt-8 w-full px-8 py-3 bg-gradient-brand rounded-btn font-bold text-white shadow-btn hover:shadow-btn-hover transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {predictMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Predicting...
                </div>
              ) : (
                'Run Prediction'
              )}
            </motion.button>
          </GlassCard>
        </div>

        {/* Results */}
        {result && (
          <div className="col-span-12 mt-2">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 content-start">
                <MetricCard label="Ensemble" value={result.prediction} unit="MWh" icon={Icons.Brain} />
                <MetricCard label="Uncertainty" value={result.uncertainty} unit="±MWh" icon={Icons.AlertCircle} />
                <MetricCard label="XGBoost" value={result.xgb_pred} unit="MWh" icon={Icons.Cpu} />
                <MetricCard label="LightGBM" value={result.lgb_pred} unit="MWh" icon={Icons.Cpu} />
              </div>

              <div className="col-span-12 xl:col-span-8">
                <GlassCard className="h-full">
                  <h2 className="text-xl font-bold mb-4">Model Comparison</h2>
                  <ModelComparisonChart result={result} />
                </GlassCard>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
