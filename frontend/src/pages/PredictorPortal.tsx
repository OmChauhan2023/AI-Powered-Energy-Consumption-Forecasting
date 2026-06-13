import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'

import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { ScenarioButton } from '@/components/ui/ScenarioButton'
import { SliderField } from '@/components/ui/SliderField'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { useCost } from '@/contexts/CostContext'
import { api } from '@/api/endpoints'
import { SCENARIOS } from '@/lib/constants'
import { hourLabel, dayLabel, monthLabel, cn } from '@/lib/utils'
import type { PredictionFeatures, PredictionResponse } from '@/api/types'

export default function PredictorPortal() {
  const { isCostMode, toggleCostMode, rate } = useCost()
  
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
      toast.success('Inference complete!')
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

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 relative">
        <ChatWidget context={{ predictionResult, features }} />
        
        {/* =========================================================
            HEADER 
            ========================================================= */}
        <div className="flex items-end justify-between bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gray-900">
              Eagle Predictor Portal
            </h1>
            <p className="text-gray-500 text-lg">
              Adjust temporal and historical features to calculate the probability of peak load. 
              Our Stacking Ensemble instantly computes XAI values and calibrated demand.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-6">
             <div className="text-right">
                <div className="text-2xl font-black text-gray-900">98.4%</div>
                <div className="text-xs text-gray-500 uppercase font-bold mt-1">R² Score</div>
             </div>
             <div className="text-right border-l border-gray-200 pl-6">
                <div className="text-2xl font-black text-gray-900">{'<'} 45ms</div>
                <div className="text-xs text-gray-500 uppercase font-bold mt-1">Inference Latency</div>
             </div>
          </div>
        </div>

        {/* =========================================================
            3-COLUMN DASHBOARD GRID
            ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* COLUMN 1: Scenario Configuration */}
          <div className="flex flex-col gap-6 h-fit">
            <GlassCard className="!p-6 h-fit">
              <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-6">
                <Icons.Settings2 className="w-5 h-5 text-gray-400" />
                Scenario Configuration
              </h3>
              
              <div className="grid grid-cols-2 gap-2 mb-8">
                {Object.entries(SCENARIOS).map(([key, scenario]) => (
                  <ScenarioButton key={key} label={scenario.label} icon={scenario.icon}
                    isActive={selectedScenario === key} onClick={() => handleScenario(key)}
                  />
                ))}
              </div>

              <div className="space-y-6">
                <SliderField label="Hour of Day" min={0} max={23} value={features.hour} onChange={(v) => updateFeature('hour', v)} formatLabel={hourLabel} />
                <SliderField label="Month" min={1} max={12} value={features.month} onChange={(v) => updateFeature('month', v)} formatLabel={monthLabel} />
                <SliderField label="Lag 24h (MWh)" min={80} max={160} step={0.5} value={features.lag_24h} onChange={(v) => updateFeature('lag_24h', v)} />
                <SliderField label="Roll Mean 24h" min={80} max={160} step={0.5} value={features.roll_mean_24h} onChange={(v) => updateFeature('roll_mean_24h', v)} />
              </div>
              
              <button onClick={() => predictMutation.mutate()} disabled={predictMutation.isPending}
                className="w-full mt-8 py-3.5 bg-black rounded-xl font-bold text-white shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {predictMutation.isPending ? 'Computing...' : 'Run Live Inference'}
              </button>
            </GlassCard>
          </div>

          {/* COLUMN 2: Inference Results & XAI */}
          <div className="flex flex-col gap-6 h-fit">
            <GlassCard className="!p-0 overflow-hidden h-fit flex flex-col border-2 border-black shadow-xl">
              <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                  <Icons.Target className="w-4 h-4 text-emerald-400" />
                  Calibrated Prediction
                </h3>
                <span className="text-xs font-semibold bg-white/10 px-2 py-1 rounded">ENSEMBLE</span>
              </div>
              
              <div className="p-8 flex flex-col items-center justify-center bg-gray-50 min-h-[220px]">
                {predictionResult ? (
                  <>
                    <div className="text-6xl font-black text-gray-900 tracking-tighter">
                      {isCostMode 
                        ? `$${(predictionResult.prediction * rate).toLocaleString(undefined, {maximumFractionDigits:0})}`
                        : `${predictionResult.prediction.toFixed(1)}`}
                      {!isCostMode && <span className="text-2xl text-gray-500 font-bold ml-2">MWh</span>}
                    </div>
                    <div className="text-sm font-medium text-gray-500 mt-4 px-4 py-1.5 bg-gray-200 rounded-full">
                      Confidence Interval: ±{isCostMode ? `$${(predictionResult.uncertainty * rate).toLocaleString(undefined, {maximumFractionDigits:0})}` : `${predictionResult.uncertainty.toFixed(1)} MWh`}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400">
                    <Icons.Brain className="w-16 h-16 mx-auto opacity-20 mb-3" />
                    <p className="font-medium">Run inference to view result</p>
                  </div>
                )}
              </div>

              {predictionResult?.feature_contributions && (
                <div className="bg-white border-t border-gray-200 p-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1">
                    <Icons.Activity className="w-4 h-4" /> Top Impact Factors (XAI)
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(predictionResult.feature_contributions).slice(0, 3).map(([feature, impact]) => (
                      <div key={feature} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                        <span className="text-gray-700 font-medium capitalize">{feature.replace(/_/g, ' ')}</span>
                        <span className={cn("font-bold px-2 py-0.5 rounded", impact > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                          {impact > 0 ? '+' : ''}{impact.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* COLUMN 3: Executive Tools */}
          <div className="flex flex-col gap-6 h-fit">
            
            {/* Tool 1: Load & Cost Calculator */}
            <GlassCard className="!p-6 h-fit border border-gray-200 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1 flex items-center gap-2">
                    <Icons.Calculator className="w-5 h-5 text-blue-500" />
                    Load & Cost Calculator
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Toggle dashboard metrics view</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 font-medium">Current Baseline</span>
                  <span className="font-bold text-gray-900">$100 / MWh</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Active Mode</span>
                  <span className={cn("font-bold", isCostMode ? "text-emerald-600" : "text-blue-600")}>
                    {isCostMode ? "Financial (AUD)" : "Energy (MWh)"}
                  </span>
                </div>
              </div>

              <button 
                onClick={toggleCostMode}
                className="w-full py-2.5 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Icons.RefreshCw className="w-4 h-4" />
                Switch to {isCostMode ? 'Energy View' : 'Cost View'}
              </button>
            </GlassCard>

            {/* Tool 2: PDF Generator */}
            <GlassCard className="!p-6 h-fit border border-gray-200 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1 flex items-center gap-2">
                    <Icons.FileText className="w-5 h-5 text-purple-500" />
                    Executive PDF Report
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Generate AI summary of inference</p>
                </div>
              </div>
              <button
                onClick={handleDownloadReport}
                disabled={!predictionResult}
                className="w-full py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Icons.Download className="w-4 h-4" />
                Download PDF
              </button>
            </GlassCard>
          </div>
          
        </div>

        {/* =========================================================
            SIGNIFICANCE STRIP
            ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
           <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Icons.Activity className="w-4 h-4 text-emerald-500" /> What is XAI?
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Explainable AI (XAI) breaks down the exact variables driving the prediction up (red) or down (green). It prevents the model from acting as a black box.
              </p>
           </div>
           <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Icons.Calculator className="w-4 h-4 text-blue-500" /> Cost Converter
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Translating raw Megawatt-Hours into estimated financial costs bridges the gap between grid operations and financial risk assessment in real-time.
              </p>
           </div>
           <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Icons.FileText className="w-4 h-4 text-purple-500" /> Reporting
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                The Gemini model automatically parses the inference numbers and XAI factors to draft a professional executive summary for stakeholders.
              </p>
           </div>
        </div>

      </div>
    </PageTransition>
  )
}
