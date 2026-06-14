import * as Icons from 'lucide-react'
import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import ReactECharts from 'echarts-for-react'

export default function Monitoring() {
  
  // Data Splitting Donut Chart Options
  const splitOptions = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center', textStyle: { color: '#94a3b8' } },
    series: [
      {
        name: 'Data Split',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: '20', fontWeight: 'bold', color: '#1e293b' }
        },
        labelLine: { show: false },
        data: [
          { value: 30710, name: 'Training Set (Dec 2016-Jul 2020)', itemStyle: { color: '#3b82f6' } },
          { value: 6581, name: 'Validation Set (Jul 2020-Apr 2021)', itemStyle: { color: '#8b5cf6' } },
          { value: 6581, name: 'Test Set (Apr 2021-Dec 2021)', itemStyle: { color: '#ec4899' } }
        ]
      }
    ]
  }

  // SHAP Feature Importance Horizontal Bar Chart
  const shapFeatures = [
    { name: 'lag_1h', score: 0.4755 },
    { name: 'covid_deviation', score: 0.1025 },
    { name: 'lag_2h', score: 0.0689 },
    { name: 'lag_24h', score: 0.0512 },
    { name: 'hour', score: 0.0393 },
    { name: 'hour_cos', score: 0.0324 },
    { name: 'day_of_week', score: 0.0207 }
  ].reverse()

  const shapOptions = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'value', boundaryGap: [0, 0.01], splitLine: { lineStyle: { color: '#f1f5f9' } } },
    yAxis: { type: 'category', data: shapFeatures.map(f => f.name), axisLabel: { color: '#64748b', fontWeight: 'bold' } },
    series: [
      {
        name: 'SHAP Value',
        type: 'bar',
        data: shapFeatures.map(f => f.score),
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#60a5fa' }]
          },
          borderRadius: [0, 5, 5, 0]
        }
      }
    ]
  }

  // Optuna Radar Chart Options
  const radarOptions = {
    tooltip: {},
    legend: { data: ['XGBoost', 'LightGBM', 'CatBoost'], bottom: 0, textStyle: { color: '#94a3b8' } },
    radar: {
      indicator: [
        { name: 'Speed', max: 100 },
        { name: 'Accuracy', max: 100 },
        { name: 'Robustness (Anomalies)', max: 100 },
        { name: 'Feature Handling', max: 100 },
        { name: 'Memory Efficiency', max: 100 }
      ],
      axisName: { color: '#64748b', fontWeight: 'bold' }
    },
    series: [{
      name: 'Model Comparison',
      type: 'radar',
      data: [
        { value: [70, 92, 85, 80, 60], name: 'XGBoost', itemStyle: { color: '#ef4444' } },
        { value: [95, 88, 70, 85, 90], name: 'LightGBM', itemStyle: { color: '#3b82f6' } },
        { value: [60, 95, 98, 95, 70], name: 'CatBoost', itemStyle: { color: '#eab308' } }
      ]
    }]
  }

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6">

        {/* =========================================================
            DATA PIPELINE & ENGINEERING (Top Section)
            ========================================================= */}
        <div className="col-span-12 lg:col-span-6">
          <GlassCard className="h-full border-t-4 border-t-blue-500 shadow-sm">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Icons.Database className="w-5 h-5 text-blue-500" /> Data Splitting & Ingestion
            </h2>
            <p className="text-sm text-text-secondary mb-6">Visual breakdown of the Train/Validation/Test split sizes.</p>
            <div className="h-[300px]">
              <ReactECharts option={splitOptions} style={{ height: '100%', width: '100%' }} />
            </div>
          </GlassCard>
        </div>

        <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
          <GlassCard className="flex-1 border-t-4 border-t-cyan-500 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icons.Filter className="w-5 h-5 text-cyan-500" /> Feature Engineering & Cleaning Rules
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-text-secondary">
                <Icons.CheckCircle2 className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <span><strong>Anomaly Detection:</strong> IQR-based flagging (2.5×) adds <code>is_anomaly</code> + z-score. We do not drop rows, preserving realistic grid strain events.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-text-secondary">
                <Icons.CheckCircle2 className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <span><strong>Missing Data:</strong> Hourly reindex + time-interpolation fills gaps.</span>
              </li>
            </ul>
          </GlassCard>

          <GlassCard className="flex-1 bg-black/5 border-none shadow-none">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icons.Lightbulb className="w-5 h-5" /> Key EDA Insights
            </h2>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white border border-border shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-800">🌅 Morning & Evening Peaks</h3>
                <p className="text-sm text-text-secondary">Clear morning (6–12h) and evening (17–22h) demand spikes driven by residential routines.</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-border shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-800">📅 Holiday & Weekend Dip</h3>
                <p className="text-sm text-text-secondary">Weekdays carry a <strong className="text-text-primary">+6.68%</strong> premium over weekends.</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* =========================================================
            MODEL ARCHITECTURE (Bottom Section)
            ========================================================= */}
        <div className="col-span-12 lg:col-span-7">
          <GlassCard className="h-full border-t-4 border-t-purple-500 shadow-sm">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Icons.Network className="w-5 h-5 text-purple-500" /> SHAP Feature Importance
            </h2>
            <p className="text-sm text-text-secondary mb-6">Top features selected by the ensemble via blended SHAP values.</p>
            <div className="h-[400px]">
              <ReactECharts option={shapOptions} style={{ height: '100%', width: '100%' }} />
            </div>
          </GlassCard>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <GlassCard className="h-full border-t-4 border-t-orange-500 shadow-sm">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Icons.BrainCircuit className="w-5 h-5 text-orange-500" /> Optuna Base Learners
            </h2>
            <p className="text-sm text-text-secondary mb-6">A structural comparison of the 3 Gradient Boosting models weighted by the Bayesian Optimizer.</p>
            <div className="h-[400px]">
              <ReactECharts option={radarOptions} style={{ height: '100%', width: '100%' }} />
            </div>
          </GlassCard>
        </div>

      </div>
    </PageTransition>
  )
}
