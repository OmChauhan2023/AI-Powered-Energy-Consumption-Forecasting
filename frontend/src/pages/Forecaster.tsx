import { useState, useEffect } from 'react'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { SliderField } from '@/components/ui/SliderField'
import { ForecastChart } from '@/components/charts/ForecastChart'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { api } from '@/api/endpoints'
import { cn } from '@/lib/utils'

const HORIZON_OPTIONS = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
  { label: '5Y', months: 60 },
  { label: '10Y', months: 120 },
  { label: '2040', months: (2040 - new Date().getFullYear()) * 12 },
]

export default function Forecaster() {
  
  // --- MACRO STATE ---
  const [horizonMonths, setHorizonMonths] = useState(120) // Default 10 years
  const [yoyGrowth, setYoyGrowth] = useState(2.0)
  const [hasPandemic, setHasPandemic] = useState(false)
  const [hasEvBoom, setHasEvBoom] = useState(false)
  const [forecastResult, setForecastResult] = useState<any>(null)

  // Live Macro Projection Engine
  useEffect(() => {
    const handler = setTimeout(() => {
      const forecasts: number[] = []
      const uncertainties: number[] = []
      const labels: string[] = []
      
      const baseMonthlyMWh = 120 * 24 * 30 // ~86,400 MWh
      
      const today = new Date()
      let currentYear = today.getFullYear()
      let currentMonth = today.getMonth()

      for (let i = 0; i <= horizonMonths; i++) {
        const yearsAhead = i / 12
        
        // 1. Apply YOY Growth (Compounding)
        let multiplier = Math.pow(1 + (yoyGrowth / 100), yearsAhead)
        
        // 2. Apply Seasonality (sine wave based on month)
        const seasonMultiplier = 1 + (Math.sin((currentMonth / 12) * Math.PI * 2) * 0.1) // +/- 10%
        
        // 3. Pandemic Shock (Drop demand by 15% between months 12 and 36)
        if (hasPandemic && i > 12 && i < 36) {
           // Create a V-shape drop and recovery
           const shockDepth = Math.min(i - 12, 36 - i) / 12 // peaks at 1.0
           multiplier *= (1 - (0.15 * shockDepth))
        }
        
        // 4. EV Boom (Exponential surge starting year 3)
        if (hasEvBoom && yearsAhead > 3) {
          multiplier *= Math.pow(1.08, yearsAhead - 3) // Extra 8% compounding
        }

        // Add 3% random noise
        const noise = (Math.random() - 0.5) * 0.06
        multiplier *= (1 + noise)
        
        const val = baseMonthlyMWh * multiplier * seasonMultiplier
        forecasts.push(val)
        
        // Uncertainty grows over time (cone of uncertainty)
        uncertainties.push(val * (0.05 + (yearsAhead * 0.015))) 
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        labels.push(`${monthNames[currentMonth]} '${String(currentYear).slice(-2)}`)
        
        currentMonth++
        if (currentMonth > 11) {
          currentMonth = 0
          currentYear++
        }
      }

      setForecastResult({ forecasts, uncertainties, labels, horizon: horizonMonths })
    }, 100) // Fast debounce
    return () => clearTimeout(handler)
  }, [horizonMonths, yoyGrowth, hasPandemic, hasEvBoom])

  const forecastStats = forecastResult && forecastResult.forecasts.length > 0 ? {
    max: Math.max(...forecastResult.forecasts),
    min: Math.min(...forecastResult.forecasts),
    mean: forecastResult.forecasts.reduce((a: number, b: number) => a + b, 0) / forecastResult.forecasts.length,
    std: Math.sqrt(forecastResult.forecasts.reduce((a: number, v: number, _i: number, arr: any[]) => 
      a + Math.pow(v - arr.reduce((x: number, y: number) => x + y) / arr.length, 2), 0) / forecastResult.forecasts.length),
  } : null

  const handleDownloadReport = async () => {
    if (!forecastResult) return
    const loadingToast = toast.loading('Generating Executive Report...')
    try {
      const payload = {
        prediction: forecastStats?.mean.toFixed(1) || 0,
        uncertainty: forecastStats?.std.toFixed(1) || 0,
        features: {
          horizon: `${horizonMonths} Months`,
          growth_rate: `${yoyGrowth}%`,
          pandemic_shock: hasPandemic ? 'Active' : 'None',
          ev_boom: hasEvBoom ? 'Active' : 'None',
        }
      }
      const blob = await api.generateReport({ data: payload })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Macro_Decadal_Forecast_${Date.now()}.pdf`
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
      <div className="flex flex-col gap-4 relative">
        <ChatWidget context={{ forecastResult, horizonMonths, yoyGrowth, hasPandemic, hasEvBoom }} />
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-extrabold tracking-tight mb-1 text-gray-900">
              Macro Scenario Planner
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Simulate decadal load growth, electrification boons, and global demand shocks out to 2040.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-5 mt-4 md:mt-0">
             <button
                onClick={handleDownloadReport}
                disabled={!forecastResult}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors flex items-center gap-2 shadow-sm"
              >
                <Icons.FileBarChart className="w-5 h-5 text-purple-400" />
                Export 15-Year PDF
              </button>
          </div>
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* COLUMN 1: Macro Controls */}
          <div className="lg:col-span-4 flex flex-col gap-5 h-fit">
            
            {/* Horizon Controls */}
            <GlassCard className="!p-5 h-fit shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Icons.CalendarDays className="w-5 h-5 text-indigo-500" />
                  Projection Timeline
                </h3>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                {HORIZON_OPTIONS.map(opt => (
                  <button key={opt.label} onClick={() => setHorizonMonths(opt.months)}
                    className={cn(
                      "py-2 rounded-xl border text-sm font-bold transition-colors",
                      horizonMonths === opt.months ? "bg-slate-900 text-white border-slate-900" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Economic Drivers */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-fit">
               <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
                 <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                   <Icons.TrendingUp className="w-5 h-5 text-emerald-500" />
                   Economic Baseline
                 </h3>
               </div>
               <div className="p-5">
                 <SliderField
                   label="Annual Growth Rate (YOY)"
                   description="Compounding baseline economic growth per year."
                   min={0} max={6} step={0.1} value={yoyGrowth}
                   onChange={setYoyGrowth} formatLabel={(v) => `+${v.toFixed(1)}%`}
                 />
               </div>
            </div>

            {/* Black Swan Events */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-fit">
               <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
                 <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                   <Icons.Activity className="w-5 h-5 text-orange-500" />
                   Shock Injectors
                 </h3>
               </div>
               <div className="p-5 flex flex-col gap-4">
                  
                  {/* Pandemic Toggle */}
                  <button 
                    onClick={() => setHasPandemic(!hasPandemic)}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
                      hasPandemic ? "bg-red-50 border-red-200" : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Icons.Biohazard className={cn("w-6 h-6 mt-1", hasPandemic ? "text-red-500" : "text-gray-400")} />
                    <div>
                      <h4 className={cn("text-sm font-extrabold", hasPandemic ? "text-red-900" : "text-gray-900")}>Global Pandemic</h4>
                      <p className="text-xs text-gray-500 mt-1">Crushes commercial/industrial load temporarily in Year 2.</p>
                    </div>
                  </button>

                  {/* EV Boom Toggle */}
                  <button 
                    onClick={() => setHasEvBoom(!hasEvBoom)}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
                      hasEvBoom ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Icons.BatteryCharging className={cn("w-6 h-6 mt-1", hasEvBoom ? "text-emerald-500" : "text-gray-400")} />
                    <div>
                      <h4 className={cn("text-sm font-extrabold", hasEvBoom ? "text-emerald-900" : "text-gray-900")}>EV Adoption Boom</h4>
                      <p className="text-xs text-gray-500 mt-1">Exponential 8% surge in grid load starting in Year 3.</p>
                    </div>
                  </button>

               </div>
            </div>
            
          </div>

          {/* COLUMN 2: Results & Chart */}
          <div className="lg:col-span-8 flex flex-col gap-5 h-fit">
            {forecastResult ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Peak Month" value={forecastStats ? (forecastStats.max / 1000).toFixed(1) : '--'} unit="GWh" />
                  <StatCard label="Trough Month" value={forecastStats ? (forecastStats.min / 1000).toFixed(1) : '--'} unit="GWh" />
                  <StatCard label="Avg Monthly" value={forecastStats ? (forecastStats.mean / 1000).toFixed(1) : '--'} unit="GWh" />
                  <StatCard label="Decadal Volatility" value={forecastStats ? (forecastStats.std / 1000).toFixed(1) : '--'} unit="GWh" />
                </div>

                {/* Chart Card */}
                <GlassCard className="!p-0 overflow-hidden h-fit flex flex-col border border-gray-200 shadow-sm rounded-xl">
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-base font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                      <Icons.TrendingUp className="w-5 h-5 text-blue-600" />
                      Macro Demand Curve
                    </h3>
                    <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                      EXPANDING CONE OF UNCERTAINTY
                    </span>
                  </div>
                  <div className="p-6 bg-white min-h-[500px]">
                    <ForecastChart 
                      forecasts={forecastResult.forecasts} 
                      uncertainties={forecastResult.uncertainties} 
                      labels={forecastResult.labels} 
                    />
                  </div>
                </GlassCard>
              </motion.div>
            ) : null}
          </div>
          
        </div>
      </div>
    </PageTransition>
  )
}
