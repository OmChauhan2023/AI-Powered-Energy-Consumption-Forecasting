import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { SliderField } from '@/components/ui/SliderField'
import { ForecastChart } from '@/components/charts/ForecastChart'
import { api } from '@/api/endpoints'

export default function Forecast() {
  const [horizon, setHorizon] = useState(24)
  const [result, setResult] = useState<any>(null)

  const forecastMutation = useMutation({
    mutationFn: () => api.forecast({ horizon }),
    onSuccess: (data) => {
      setResult(data)
      toast.success(`${data.horizon}h forecast generated!`)
    },
    onError: () => {
      toast.error('Forecast failed — check API connection')
    },
  })

  const stats =
    result && result.forecasts.length > 0
      ? {
          max: Math.max(...result.forecasts),
          min: Math.min(...result.forecasts),
          mean: result.forecasts.reduce((a: number, b: number) => a + b, 0) / result.forecasts.length,
          std: Math.sqrt(
            result.forecasts.reduce((a: number, v: number, _i: number, arr: any[]) => a + Math.pow(v - arr.reduce((x: number, y: number) => x + y) / arr.length, 2), 0) /
              result.forecasts.length
          ),
        }
      : null

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          {/* Horizon Controls */}
          <GlassCard className="h-full">
            <h2 className="text-xl font-bold mb-6">Forecast Horizon</h2>

            <SliderField
              label={`${horizon} Hours Ahead`}
              min={1}
              max={168}
              value={horizon}
              onChange={setHorizon}
              formatLabel={(v) => `${v} hours`}
            />

            <div className="flex gap-3 mt-6">
              <motion.button
                onClick={() => setHorizon(24)}
                className="flex-1 px-4 py-2 rounded-btn bg-black/5 hover:bg-black/10 text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                24 Hours
              </motion.button>
              <motion.button
                onClick={() => setHorizon(48)}
                className="flex-1 px-4 py-2 rounded-btn bg-black/5 hover:bg-black/10 text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                48 Hours
              </motion.button>
              <motion.button
                onClick={() => setHorizon(168)}
                className="flex-1 px-4 py-2 rounded-btn bg-black/5 hover:bg-black/10 text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                7 Days
              </motion.button>
            </div>

            <motion.button
              onClick={() => forecastMutation.mutate()}
              disabled={forecastMutation.isPending}
              className="w-full mt-6 px-8 py-3 bg-gradient-brand rounded-btn font-bold text-white shadow-btn hover:shadow-btn-hover transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {forecastMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </div>
              ) : (
                `Generate ${horizon}h Forecast`
              )}
            </motion.button>
          </GlassCard>
        </div>

        {/* Statistics Cards */}
        <div className="col-span-12 xl:col-span-4 grid grid-cols-2 gap-3 content-start">
          <StatCard label="Max" value={stats?.max.toFixed(1) ?? '--'} unit="MWh" />
            <StatCard label="Min" value={stats?.min.toFixed(1) ?? '--'} unit="MWh" />
            <StatCard label="Mean" value={stats?.mean.toFixed(1) ?? '--'} unit="MWh" />
            <StatCard label="Std" value={stats?.std.toFixed(1) ?? '--'} unit="MWh" />
          </div>

        {/* Forecast Chart */}
        {result && (
          <div className="col-span-12">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard>
                <h2 className="text-xl font-bold mb-4">Forecast with Uncertainty Band</h2>
                <ForecastChart forecasts={result.forecasts} uncertainties={result.uncertainties} />
              </GlassCard>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
