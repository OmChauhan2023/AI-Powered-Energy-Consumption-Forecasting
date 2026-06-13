import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { SliderField } from '@/components/ui/SliderField'
import { ForecastChart } from '@/components/charts/ForecastChart'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { WeatherPanel } from '@/components/ui/WeatherPanel'
import { api } from '@/api/endpoints'

export default function Forecaster() {
  
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

  const handleDownloadReport = async () => {
    if (!forecastResult) return
    const loadingToast = toast.loading('Generating AI Report...')
    try {
      const payload = {
        prediction: forecastStats?.mean.toFixed(1) || 0,
        uncertainty: forecastStats?.std.toFixed(1) || 0,
        features: {
          horizon: `${horizon} Hours`,
          max_load: forecastStats?.max.toFixed(1) || 0,
          min_load: forecastStats?.min.toFixed(1) || 0
        }
      }
      const blob = await api.generateReport({ data: payload })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Eagle_LongTerm_Forecast_${Date.now()}.pdf`
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
      <div className="flex flex-col gap-6 relative">
        <ChatWidget context={{ forecastResult, horizon }} />
        
        {/* =========================================================
            HEADER 
            ========================================================= */}
        <div className="flex items-end justify-between bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gray-900">
              Long-Term Forecaster
            </h1>
            <p className="text-gray-500 text-lg">
              Generate advanced energy projections. Weather constraints and historical lag patterns are utilized to build highly accurate confidence intervals.
            </p>
          </div>
        </div>

        {/* =========================================================
            3-COLUMN DASHBOARD GRID
            ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* COLUMN 1: Weather Context */}
          <div className="flex flex-col gap-6 h-fit">
             <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm h-fit">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Icons.CloudRain className="w-4 h-4 text-blue-500" />
                    External Drivers
                  </h3>
                </div>
                <div className="p-4 bg-gray-50/50">
                  <WeatherPanel />
                </div>
             </div>
          </div>

          {/* COLUMN 2: Simulation Controls */}
          <div className="flex flex-col gap-6 h-fit">
            <GlassCard className="!p-6 h-fit">
              <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-6">
                <Icons.Clock className="w-5 h-5 text-gray-400" />
                Simulation Horizon
              </h3>
              <SliderField
                label={`${horizon} Hours Ahead`}
                min={1} max={168} value={horizon}
                onChange={setHorizon} formatLabel={(v) => `${v} hours`}
              />
              <div className="flex gap-2 mt-6">
                {[24, 48, 168].map(h => (
                  <button key={h} onClick={() => setHorizon(h)}
                    className="flex-1 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-sm transition-colors"
                  >
                    {h === 168 ? '7 Days' : `${h}h`}
                  </button>
                ))}
              </div>
              <button
                onClick={() => forecastMutation.mutate()} disabled={forecastMutation.isPending}
                className="w-full mt-6 py-3.5 bg-black rounded-xl font-bold text-white shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {forecastMutation.isPending ? 'Generating...' : `Generate ${horizon}h Curve`}
              </button>
            </GlassCard>
          </div>

          {/* COLUMN 3: Executive Tools */}
          <div className="flex flex-col gap-6 h-fit">
            <GlassCard className="!p-6 h-fit border border-gray-200 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1 flex items-center gap-2">
                    <Icons.FileText className="w-5 h-5 text-purple-500" />
                    Executive PDF Report
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Generate AI summary of forecast</p>
                </div>
              </div>
              <button
                onClick={handleDownloadReport}
                disabled={!forecastResult}
                className="w-full py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Icons.Download className="w-4 h-4" />
                Download PDF
              </button>
            </GlassCard>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Icons.AlertTriangle className="w-4 h-4 text-orange-500" /> Uncertainty Bands
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                The grey shaded area on the chart represents the 95% confidence interval. High variance indicates weather or time-of-day instability.
              </p>
            </div>
          </div>
          
        </div>

        {/* =========================================================
            RESULTS AREA (BOTTOM SPAN)
            ========================================================= */}
        {forecastResult && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 mb-8 mt-2">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 content-start">
              <StatCard label="Peak Forecast" value={forecastStats ? forecastStats.max.toFixed(1) : '--'} unit="MWh" />
              <StatCard label="Minimum Forecast" value={forecastStats ? forecastStats.min.toFixed(1) : '--'} unit="MWh" />
              <StatCard label="Average Demand" value={forecastStats ? forecastStats.mean.toFixed(1) : '--'} unit="MWh" />
              <StatCard label="Std Deviation" value={forecastStats ? forecastStats.std.toFixed(1) : '--'} unit="MWh" />
            </div>

            <GlassCard className="border-2 border-black">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-gray-900">Projected Demand Curve</h2>
                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">95% CONFIDENCE INTERVAL</span>
              </div>
              <ForecastChart forecasts={forecastResult.forecasts} uncertainties={forecastResult.uncertainties} />
            </GlassCard>
          </motion.div>
        )}

      </div>
    </PageTransition>
  )
}
