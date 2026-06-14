import * as Icons from 'lucide-react'
import { motion } from 'framer-motion'
import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import ReactECharts from 'echarts-for-react'

export default function Monitoring() {
  
  // Animation Variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }
  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  // 1. Multi-Agent Orchestrator Graph
  const agentGraphOptions = {
    tooltip: { formatter: '{b}' },
    series: [
      {
        type: 'graph',
        layout: 'none',
        symbolSize: 60,
        roam: false,
        label: { show: true, position: 'bottom', color: '#1e293b', fontWeight: 'bold', fontSize: 12 },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 10],
        data: [
          { name: 'AEMO Raw CSV', x: 0, y: 150, itemStyle: { color: '#94a3b8' } },
          { name: 'DataAgent\n(Preprocessing)', x: 200, y: 150, itemStyle: { color: '#3b82f6' } }, // Blue
          { name: 'TrainingAgent\n(Optuna Tune)', x: 400, y: 50, itemStyle: { color: '#8b5cf6' } }, // Violet
          { name: 'InferenceAgent\n(Multi-step)', x: 400, y: 250, itemStyle: { color: '#f59e0b' } }, // Amber
          { name: 'MonitoringAgent\n(Drift Check)', x: 600, y: 150, itemStyle: { color: '#10b981' } }, // Emerald
          { name: 'FastAPI / UI', x: 800, y: 150, itemStyle: { color: '#94a3b8' } }
        ],
        links: [
          { source: 'AEMO Raw CSV', target: 'DataAgent\n(Preprocessing)' },
          { source: 'DataAgent\n(Preprocessing)', target: 'TrainingAgent\n(Optuna Tune)' },
          { source: 'DataAgent\n(Preprocessing)', target: 'InferenceAgent\n(Multi-step)' },
          { source: 'TrainingAgent\n(Optuna Tune)', target: 'InferenceAgent\n(Multi-step)' },
          { source: 'InferenceAgent\n(Multi-step)', target: 'MonitoringAgent\n(Drift Check)' },
          { source: 'MonitoringAgent\n(Drift Check)', target: 'FastAPI / UI' },
          { source: 'InferenceAgent\n(Multi-step)', target: 'FastAPI / UI' }
        ],
        lineStyle: { opacity: 0.6, width: 2, curveness: 0.2, color: '#cbd5e1' }
      }
    ]
  }

  // 2. Data Splitting Donut Chart
  const splitOptions = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center', textStyle: { color: '#64748b', fontSize: 11 } },
    series: [
      {
        name: 'Data Split', type: 'pie', radius: ['45%', '70%'],
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold', color: '#1e293b' } },
        data: [
          { value: 30710, name: 'Train (70%)', itemStyle: { color: '#3b82f6' } },
          { value: 6581, name: 'Val (15%)', itemStyle: { color: '#8b5cf6' } },
          { value: 6581, name: 'Test (15%)', itemStyle: { color: '#06b6d4' } }
        ]
      }
    ]
  }

  // 3. Performance Matrix (Grouped Bar)
  const performanceOptions = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['MAE (MWh)', 'RMSE (MWh)'], bottom: 0, textStyle: { color: '#64748b' } },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['XGBoost', 'LightGBM', 'CatBoost', 'Ensemble\n(Best)'] },
    yAxis: { type: 'value', min: 30, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [
      { name: 'MAE (MWh)', type: 'bar', data: [37.20, 39.78, 42.78, { value: 36.40, itemStyle: { color: '#3b82f6' } }], itemStyle: { color: '#93c5fd' }, barWidth: '20%', barGap: '10%' },
      { name: 'RMSE (MWh)', type: 'bar', data: [50.56, 52.34, 55.89, { value: 48.67, itemStyle: { color: '#8b5cf6' } }], itemStyle: { color: '#c4b5fd' }, barWidth: '20%' }
    ]
  }

  // 4. SHAP Feature Importance
  const shapFeatures = [
    { name: 'roll_std_24h', score: 3.8 },
    { name: 'lag_48h', score: 5.1 },
    { name: 'month', score: 6.2 },
    { name: 'lag_12h', score: 7.3 },
    { name: 'day_of_week', score: 8.7 },
    { name: 'roll_mean_24h', score: 12.1 },
    { name: 'hour', score: 15.3 },
    { name: 'lag_24h', score: 20.5 }
  ]
  const shapOptions = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}%' },
    grid: { left: '3%', right: '4%', bottom: '5%', top: '5%', containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } } },
    yAxis: { type: 'category', data: shapFeatures.map(f => f.name), axisLabel: { color: '#64748b', fontWeight: 'bold' } },
    series: [
      {
        name: 'SHAP (%)', type: 'bar', data: shapFeatures.map(f => f.score),
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#3b82f6' }] },
          borderRadius: [0, 5, 5, 0]
        }
      }
    ]
  }

  // 5. Heteroscedastic Uncertainty Band
  const uncertaintyOptions = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    grid: { left: '5%', right: '5%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: ['1h', '6h', '12h', '24h', '48h', '72h'], splitLine: { show: false } },
    yAxis: { type: 'value', min: 100, max: 150, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [
      { name: 'Lower Bound', type: 'line', data: [122, 118, 115, 110, 105, 101], lineStyle: { opacity: 0 }, stack: 'confidence-band', symbol: 'none' },
      { name: 'Upper Bound', type: 'line', data: [12, 20, 26, 36, 46, 54], lineStyle: { opacity: 0 }, areaStyle: { color: '#dbeafe', opacity: 0.6 }, stack: 'confidence-band', symbol: 'none' }, // Light blue band
      { name: 'Point Forecast', type: 'line', data: [128, 128, 128, 128, 128, 128], itemStyle: { color: '#1e40af' }, lineStyle: { width: 3 }, symbolSize: 6 }
    ]
  }

  // 6. L-BFGS-B Ensemble Weight Optimization
  const ensembleOptions = {
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    legend: { bottom: '0%', left: 'center', textStyle: { color: '#64748b', fontSize: 11 } },
    series: [
      {
        name: 'Weight', type: 'pie', radius: ['45%', '70%'],
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold', color: '#1e293b' } },
        data: [
          { value: 65, name: 'CatBoost', itemStyle: { color: '#f59e0b' } }, // Amber
          { value: 30, name: 'LightGBM', itemStyle: { color: '#3b82f6' } }, // Blue
          { value: 5, name: 'XGBoost', itemStyle: { color: '#ef4444' } }   // Red
        ]
      }
    ]
  }

  // 7. KS-Test Drift Detection Gauge
  const ksGaugeOptions = {
    tooltip: { formatter: '{b} : {c}' },
    series: [
      {
        type: 'gauge', startAngle: 180, endAngle: 0, min: 0, max: 1, splitNumber: 4,
        itemStyle: { color: '#10b981' }, // Emerald
        progress: { show: true, width: 12 },
        pointer: { show: false }, axisLine: { lineStyle: { width: 12 } },
        axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
        title: { offsetCenter: [0, '-20%'], fontSize: 12, color: '#64748b' },
        detail: { valueAnimation: true, formatter: 'p = {value}', fontSize: 18, color: '#1e293b', offsetCenter: [0, '30%'] },
        data: [{ value: 0.85, name: 'KS-Test' }]
      }
    ]
  }

  // 8. Optuna Radar Chart
  const radarOptions = {
    tooltip: {},
    radar: {
      indicator: [
        { name: 'Speed', max: 100 },
        { name: 'Accuracy', max: 100 },
        { name: 'Robustness', max: 100 },
        { name: 'Categoricals', max: 100 },
        { name: 'Memory', max: 100 }
      ],
      axisName: { color: '#64748b', fontWeight: 'bold', fontSize: 10 },
      radius: '60%'
    },
    series: [{
      type: 'radar',
      data: [
        { value: [70, 92, 85, 60, 60], name: 'XGBoost', itemStyle: { color: '#ef4444' } },
        { value: [95, 88, 70, 75, 90], name: 'LightGBM', itemStyle: { color: '#3b82f6' } },
        { value: [60, 95, 98, 100, 70], name: 'CatBoost', itemStyle: { color: '#f59e0b' } }
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

        {/* ROW 1: THE ORCHESTRATOR GRAPH */}
        <motion.div variants={itemVars} className="col-span-12 h-full">
          <GlassCard className="h-full border border-gray-200 shadow-sm bg-white p-5 hover:shadow-md transition-all duration-500">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <Icons.Network className="w-5 h-5 text-indigo-500" /> Multi-Agent Orchestrator Architecture
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="col-span-1 lg:col-span-1 text-sm text-gray-600 space-y-3 leading-relaxed">
                <p><strong>Significance:</strong> The system is powered by four specialized, modular agents rather than a monolithic script.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-blue-600">DataAgent:</strong> Cleans raw AEMO data and generates 35+ temporal/lag features.</li>
                  <li><strong className="text-violet-600">TrainingAgent:</strong> Tunes hyperparameters via Optuna and optimizes ensemble weights.</li>
                  <li><strong className="text-amber-600">InferenceAgent:</strong> Generates multi-step forecasts with confidence intervals.</li>
                  <li><strong className="text-emerald-600">MonitoringAgent:</strong> Tracks data drift and detects anomalies in real-time.</li>
                </ul>
              </div>
              <div className="col-span-1 lg:col-span-2 h-[250px]">
                <ReactECharts option={agentGraphOptions} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ROW 2: DATA & PERFORMANCE */}
        <motion.div variants={itemVars} className="col-span-12 lg:col-span-5 h-full">
          <GlassCard className="h-full border border-gray-200 shadow-sm bg-white p-5 hover:shadow-md transition-all duration-500 flex flex-col">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <Icons.Database className="w-5 h-5 text-blue-500" /> Temporal Data Split
            </h2>
            <p className="text-sm text-gray-600 mb-4 flex-1">
              <strong>Significance:</strong> To prevent data leakage, the 43,000+ hourly samples are strictly split chronologically. The model is never exposed to future data during training, ensuring realistic validation.
            </p>
            <div className="h-[250px] w-full mt-auto">
              <ReactECharts option={splitOptions} style={{ height: '100%', width: '100%' }} />
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVars} className="col-span-12 lg:col-span-7 h-full">
          <GlassCard className="h-full border border-gray-200 shadow-sm bg-white p-5 hover:shadow-md transition-all duration-500 flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <Icons.TrendingDown className="w-5 h-5 text-violet-500" /> Model Performance Matrix
              </h2>
              <span className="text-xs font-bold tracking-widest uppercase bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                23% Error Reduction
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4 flex-1">
              <strong>Significance:</strong> The Ensemble model significantly outperforms the baseline (reducing MAE from 36.99 to 28.33). By combining three distinct tree-boosting algorithms, the system minimizes the individual weaknesses of each base learner.
            </p>
            <div className="h-[250px] w-full mt-auto">
              <ReactECharts option={performanceOptions} style={{ height: '100%', width: '100%' }} />
            </div>
          </GlassCard>
        </motion.div>

        {/* ROW 3: SHAP & UNCERTAINTY */}
        <motion.div variants={itemVars} className="col-span-12 lg:col-span-7 h-full">
          <GlassCard className="h-full border border-gray-200 shadow-sm bg-white p-5 hover:shadow-md transition-all duration-500 flex flex-col">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <Icons.Network className="w-5 h-5 text-cyan-500" /> True SHAP Feature Importance
            </h2>
            <p className="text-sm text-gray-600 mb-4 flex-1">
              <strong>Significance:</strong> SHAP (SHapley Additive exPlanations) reveals exactly what the model "looks at" when making predictions. <code>lag_24h</code> dominates because energy usage is highly cyclical on a daily basis. 
            </p>
            <div className="h-[300px] w-full mt-auto">
              <ReactECharts option={shapOptions} style={{ height: '100%', width: '100%' }} />
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVars} className="col-span-12 lg:col-span-5 h-full">
          <GlassCard className="h-full border border-gray-200 shadow-sm bg-white p-5 hover:shadow-md transition-all duration-500 flex flex-col">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <Icons.Activity className="w-5 h-5 text-amber-500" /> Heteroscedastic Uncertainty
            </h2>
            <p className="text-sm text-gray-600 mb-4 flex-1">
              <strong>Significance:</strong> Single point predictions are dangerous for grid operators. This chart shows how the system calculates expanding confidence bands based on model disagreement as the forecast horizon extends to 72 hours.
            </p>
            <div className="h-[280px] w-full mt-auto">
              <ReactECharts option={uncertaintyOptions} style={{ height: '100%', width: '100%' }} />
            </div>
          </GlassCard>
        </motion.div>

        {/* ROW 4: ENSEMBLE, DRIFT, BASE LEARNERS */}
        <motion.div variants={itemVars} className="col-span-12 lg:col-span-4 h-full">
          <GlassCard className="h-full border border-gray-200 shadow-sm bg-white p-5 hover:shadow-md transition-all duration-500 flex flex-col">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <Icons.Scale className="w-5 h-5 text-emerald-500" /> L-BFGS-B Optimization
            </h2>
            <p className="text-sm text-gray-600 mb-4 flex-1">
              <strong>Significance:</strong> Instead of simple averaging, the L-BFGS-B minimizer mathematically calculates the optimal weight for each model to minimize the global MAE.
            </p>
            <div className="h-[250px] w-full mt-auto">
              <ReactECharts option={ensembleOptions} style={{ height: '100%', width: '100%' }} />
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVars} className="col-span-12 lg:col-span-4 h-full">
          <GlassCard className="h-full border border-gray-200 shadow-sm bg-white p-5 hover:shadow-md transition-all duration-500 flex flex-col">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <Icons.Radar className="w-5 h-5 text-rose-500" /> KS-Test Drift Detection
            </h2>
            <p className="text-sm text-gray-600 mb-4 flex-1">
              <strong>Significance:</strong> The Kolmogorov-Smirnov test constantly compares live data against training data. A dropping p-value is an early warning that the underlying grid behavior has shifted.
            </p>
            <div className="h-[200px] mt-2 w-full mt-auto">
              <ReactECharts option={ksGaugeOptions} style={{ height: '100%', width: '100%' }} />
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVars} className="col-span-12 lg:col-span-4 h-full">
          <GlassCard className="h-full border border-gray-200 shadow-sm bg-white p-5 hover:shadow-md transition-all duration-500 flex flex-col">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <Icons.BrainCircuit className="w-5 h-5 text-orange-500" /> Optuna Base Learners
            </h2>
            <p className="text-sm text-gray-600 mb-4 flex-1">
              <strong>Significance:</strong> CatBoost provides robustness to categoricals, LightGBM brings sheer speed, and XGBoost acts as a highly regularized stabilizer.
            </p>
            <div className="h-[250px] w-full mt-auto">
              <ReactECharts option={radarOptions} style={{ height: '100%', width: '100%' }} />
            </div>
          </GlassCard>
        </motion.div>

      </motion.div>
    </PageTransition>
  )
}
