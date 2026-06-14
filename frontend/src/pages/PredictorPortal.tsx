import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'

import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { ScenarioButton } from '@/components/ui/ScenarioButton'
import { SliderField } from '@/components/ui/SliderField'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { api } from '@/api/endpoints'
import { SCENARIOS } from '@/lib/constants'
import { hourLabel, monthLabel, cn } from '@/lib/utils'
import type { PredictionFeatures, PredictionResponse } from '@/api/types'

const FINANCIAL_RATE_AUD = 134 // Updated market rate: $134 per MWh

export default function PredictorPortal() {
  
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
    },
    onError: () => toast.error('Prediction failed — check API connection'),
  })

  // Live Predictions with 150ms Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      predictMutation.mutate()
    }, 150)
    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features])

  const updateFeature = (key: keyof PredictionFeatures, value: number) => setFeatures((prev) => ({ ...prev, [key]: value }))
  const handleScenario = (key: string) => {
    setSelectedScenario(key)
    const base = SCENARIOS[key].features
    // Add ±2.5 MWh of random jitter to continuous features so repeated clicks yield live updates
    const jitter = () => (Math.random() - 0.5) * 5
    
    setFeatures({
      ...base,
      lag_24h: Number((base.lag_24h + jitter()).toFixed(1)),
      lag_12h: Number((base.lag_12h + jitter()).toFixed(1)),
      roll_mean_24h: Number((base.roll_mean_24h + jitter()).toFixed(1)),
    })
  }

  const handleDownloadReport = async () => {
    if (!predictionResult) return
    const loadingToast = toast.loading('Generating AI Report...')
    try {
      const blob = await api.generateReport({ data: { ...predictionResult, features } })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Eagle_Executive_Report_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Report downloaded!', { id: loadingToast })
    } catch {
      toast.error('Failed to generate report', { id: loadingToast })
    }
  }

  const getGridStatus = (mwh: number) => {
    if (mwh < 120) return { label: 'OPTIMAL', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <Icons.CheckCircle2 className="w-5 h-5" /> }
    if (mwh <= 135) return { label: 'ELEVATED', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Icons.AlertTriangle className="w-5 h-5" /> }
    return { label: 'CRITICAL', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <Icons.AlertCircle className="w-5 h-5" /> }
  }

  const getPrimaryDriver = (contributions: Record<string, number>) => {
    const entries = Object.entries(contributions)
    if (entries.length === 0) return 'historical baseline trends.'
    const primary = entries.reduce((max, current) => Math.abs(current[1]) > Math.abs(max[1]) ? current : max)
    const direction = primary[1] > 0 ? 'adding' : 'reducing'
    const name = primary[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    return `${name}, which is ${direction} ${Math.abs(primary[1]).toFixed(2)} MWh.`
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-4 relative">
        <ChatWidget context={{ predictionResult, features }} />
        
        {/* =========================================================
            HEADER 
            ========================================================= */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-extrabold tracking-tight mb-1 text-gray-900">
              Eagle Predictor Dashboard
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Adjust temporal features to simulate grid impact. The Stacking Ensemble computes MWh load, financial cost, and XAI factors instantly.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-5 mt-4 md:mt-0">
             <div className="text-right">
                <div className="text-xl font-black text-gray-900">98.4%</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Ensemble R²</div>
             </div>
             <div className="text-right border-l border-gray-200 pl-5">
                <div className="text-xl font-black text-emerald-600">${FINANCIAL_RATE_AUD}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Cost Rate / MWh</div>
             </div>
          </div>
        </div>

        {/* =========================================================
            2-COLUMN DENSE DASHBOARD GRID
            ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* COLUMN 1: Inputs & Logic (Left Side - 5 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6 h-fit">
            <GlassCard className="!p-5 h-fit shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Icons.Settings2 className="w-5 h-5 text-gray-400" />
                  Scenario Logic & Inputs
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-6">
                {Object.entries(SCENARIOS).map(([key, scenario]) => (
                  <ScenarioButton key={key} label={scenario.label} icon={scenario.icon}
                    isActive={selectedScenario === key} onClick={() => handleScenario(key)}
                  />
                ))}
              </div>

              <div className="space-y-2">
                <SliderField 
                  label="Hour of Day" 
                  description="Morning (7-9 AM) & Evening (5-8 PM) drive highest demand."
                  min={0} max={23} value={features.hour} onChange={(v) => updateFeature('hour', v)} formatLabel={hourLabel} 
                />
                
                <SliderField 
                  label="Month" 
                  description="Winter (heating) & Summer (cooling) cause major spikes."
                  min={1} max={12} value={features.month} onChange={(v) => updateFeature('month', v)} formatLabel={monthLabel} 
                />
                
                <SliderField 
                  label="Lag 24h (MWh)" 
                  description="Prior day's exact load, capturing daily cyclical habits."
                  min={80} max={160} step={0.5} value={features.lag_24h} onChange={(v) => updateFeature('lag_24h', v)} 
                />
                
                <SliderField 
                  label="Roll Mean 24h" 
                  description="Smoothed 24h average load, removing sudden anomalies."
                  min={80} max={160} step={0.5} value={features.roll_mean_24h} onChange={(v) => updateFeature('roll_mean_24h', v)} 
                />
              </div>
            </GlassCard>
          </div>

          {/* COLUMN 2: Dual Results & Executive Tools (Right Side - 7 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-8 h-fit">
            
            {/* Calibrated Impact & Status Panel */}
            <GlassCard className="!p-0 overflow-hidden h-fit flex flex-col border border-gray-200 shadow-sm rounded-xl relative">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-base font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <Icons.Target className="w-5 h-5 text-emerald-500" />
                  Calibrated AI Impact Assessment
                </h3>
                <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                  ENSEMBLE MODEL
                </span>
              </div>
              
              <div className="p-6 bg-white min-h-[220px]">
                {predictionResult ? (
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    
                    {/* Left Side: Live Metrics & Insight */}
                    <div className="flex flex-col items-center border-r border-gray-100 pr-4">
                      
                      {/* Status Pill */}
                      {(() => {
                        const status = getGridStatus(predictionResult.prediction)
                        return (
                          <div className={cn("flex items-center gap-2 px-5 py-2 rounded-full border shadow-sm mb-6", status.bg, status.border, status.text)}>
                            {status.icon}
                            <span className="text-base font-black tracking-widest uppercase">{status.label} LOAD</span>
                          </div>
                        )
                      })()}

                      {/* Vertical Metrics */}
                      <div className="flex flex-col items-center text-center">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Predicted Energy Demand</div>
                        <div className="text-6xl font-black text-gray-900 tracking-tighter mb-1">
                          {predictionResult.prediction.toFixed(1)}<span className="text-2xl text-gray-400 font-bold ml-1">MWh</span>
                        </div>
                        <div className="text-base font-bold text-gray-400 mb-6">
                          ± {predictionResult.uncertainty.toFixed(1)} MWh
                        </div>
                        
                        <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex flex-col text-right">
                             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Financial Cost</span>
                          </div>
                          <div className="text-3xl font-black text-emerald-600 tracking-tighter border-l border-gray-200 pl-3">
                            ${(predictionResult.prediction * FINANCIAL_RATE_AUD).toLocaleString(undefined, {maximumFractionDigits:0})}
                          </div>
                        </div>
                      </div>
                      
                      {/* AI Insight Summary */}
                      {predictionResult.feature_contributions && (
                        <div className="mt-8 pt-6 border-t border-gray-100 w-full text-center max-w-sm">
                           <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                             <Icons.Sparkles className="w-5 h-5" />
                             <span className="text-xs font-black uppercase tracking-widest">AI Insight Generated</span>
                           </div>
                           <p className="text-base font-medium text-gray-600 leading-relaxed">
                             This <span className={cn("font-bold", getGridStatus(predictionResult.prediction).text)}>{getGridStatus(predictionResult.prediction).label.toLowerCase()}</span> load scenario is primarily driven by <strong>{getPrimaryDriver(predictionResult.feature_contributions)}</strong>
                           </p>
                        </div>
                      )}
                    </div>

                    {/* Right Side: Significance & Actions */}
                    <div className="flex flex-col h-full pl-4">
                      
                      {/* Significance Box (Top) */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex flex-col p-5 bg-transparent rounded-xl border border-gray-200 shadow-sm">
                          <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-2 mb-2">
                            <Icons.HelpCircle className="w-5 h-5 text-indigo-500" />
                            Grid Significance
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed mb-4">
                            This dashboard evaluates live predictions against historical baselines. The <strong>Status Level</strong> indicates the severity of grid strain.
                          </p>
                          
                          <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shadow-[0_0_8px_rgba(239,68,68,0.6)] shrink-0" />
                              <div>
                                <span className="text-sm font-bold text-slate-800 block">Critical (&gt; 135 MWh)</span>
                                <span className="text-xs text-slate-500">Extreme grid strain. High risk of deficits.</span>
                              </div>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shadow-[0_0_8px_rgba(245,158,11,0.6)] shrink-0" />
                              <div>
                                <span className="text-sm font-bold text-slate-800 block">Elevated (120-135 MWh)</span>
                                <span className="text-xs text-slate-500">Above average demand. Monitor capacity.</span>
                              </div>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0" />
                              <div>
                                <span className="text-sm font-bold text-slate-800 block">Optimal (&lt; 120 MWh)</span>
                                <span className="text-xs text-slate-500">Standard baseload. Cost-efficient.</span>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* PDF Export Action (Bottom - mirroring AI Insight line) */}
                      <div className="mt-8 pt-6 border-t border-gray-100 w-full">
                        <button
                          onClick={handleDownloadReport}
                          disabled={!predictionResult}
                          className="w-full px-4 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          <Icons.FileBarChart className="w-5 h-5 text-emerald-400" />
                          Export Executive PDF
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Icons.Cpu className="w-20 h-20 mx-auto opacity-20 mb-4" />
                    <p className="font-semibold text-lg">Awaiting scenario execution...</p>
                  </div>
                )}
              </div>
            </GlassCard>

          </div>
          
        </div>

      </div>
    </PageTransition>
  )
}
