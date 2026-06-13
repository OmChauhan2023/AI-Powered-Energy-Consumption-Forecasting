import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { SliderField } from '@/components/ui/SliderField'
import { ForecastChart } from '@/components/charts/ForecastChart'
import { useCost } from '@/contexts/CostContext'
import { api } from '@/api/endpoints'

export default function Forecaster() {
  const { isCostMode, rate } = useCost()
  
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

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6 relative">
        
        <div className="col-span-12">
          <div className="mb-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Long-Term Horizon Generator</h1>
            <p className="text-text-secondary mt-2 max-w-3xl leading-relaxed">
              Generate long-term energy forecasts to anticipate system loads over the coming days. The ensemble model produces an uncertainty band to help you prepare for peak deviations.
            </p>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-8">
          <GlassCard className="h-full">
            <h2 className="text-xl font-bold mb-6">Simulation Horizon</h2>
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
          <StatCard label="Max" value={forecastStats ? (isCostMode ? `$${(forecastStats.max * rate).toLocaleString(undefined, {maximumFractionDigits:0})}` : forecastStats.max.toFixed(1)) : '--'} unit={isCostMode ? "" : "MWh"} />
          <StatCard label="Min" value={forecastStats ? (isCostMode ? `$${(forecastStats.min * rate).toLocaleString(undefined, {maximumFractionDigits:0})}` : forecastStats.min.toFixed(1)) : '--'} unit={isCostMode ? "" : "MWh"} />
          <StatCard label="Mean" value={forecastStats ? (isCostMode ? `$${(forecastStats.mean * rate).toLocaleString(undefined, {maximumFractionDigits:0})}` : forecastStats.mean.toFixed(1)) : '--'} unit={isCostMode ? "" : "MWh"} />
          <StatCard label="Std" value={forecastStats ? (isCostMode ? `$${(forecastStats.std * rate).toLocaleString(undefined, {maximumFractionDigits:0})}` : forecastStats.std.toFixed(1)) : '--'} unit={isCostMode ? "" : "MWh"} />
        </div>

        {forecastResult && (
          <div className="col-span-12 mb-8 mt-2">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard>
                <h2 className="text-xl font-bold mb-4">Forecast with Uncertainty Band</h2>
                <ForecastChart forecasts={forecastResult.forecasts} uncertainties={forecastResult.uncertainties} />
              </GlassCard>
            </motion.div>
          </div>
        )}

      </div>
    </PageTransition>
  )
}
