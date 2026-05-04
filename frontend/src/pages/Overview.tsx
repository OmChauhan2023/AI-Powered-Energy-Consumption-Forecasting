import { PageTransition } from '@/components/layout/PageTransition'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import * as Icons from 'lucide-react'

export default function Overview() {
  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6">
        
        {/* Hero Section */}
        <div className="col-span-12 xl:col-span-8">
          <GlassCard className="h-full flex flex-col justify-center">
            <h1 className="text-3xl font-black text-text-primary mb-4 tracking-tight">
              AI-Powered Energy Forecast Pro
            </h1>
            <p className="text-text-secondary leading-relaxed mb-6">
              An enterprise-grade machine learning platform designed to predict energy consumption with pinpoint accuracy. 
              Leveraging an optimized ensemble of XGBoost, LightGBM &amp; CatBoost with SHAP-driven feature selection, 
              IQR anomaly detection, and rich temporal engineering aligned to the Australian grid.
            </p>
            
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'FastAPI', 'Python', 'Optuna', 'SHAP', 'CatBoost', 'XGBoost', 'LightGBM'].map(tech => (
                <span key={tech} className="px-3 py-1 bg-black/5 text-text-primary text-xs font-semibold rounded-full">
                  {tech}
                </span>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* The Best Model */}
        <div className="col-span-12 xl:col-span-4">
          <GlassCard className="h-full bg-black/5 border-none shadow-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                <Icons.Brain className="w-5 h-5 text-text-primary" />
              </div>
              <h2 className="text-xl font-bold">The Optuna Ensemble</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Our forecasting engine is powered by an optimized Ensemble model. It dynamically weights the predictions of 
              <strong className="text-text-primary font-semibold"> CatBoost, XGBoost, and LightGBM</strong>. 
              We utilize Bayesian Optimization via Optuna to fine-tune the hyperparameters and ensemble weights, effectively 
              minimizing the Mean Absolute Error (MAE) and ensuring robustness across all seasons.
            </p>
          </GlassCard>
        </div>

        {/* Model Performance */}
        <div className="col-span-12">
          <GlassCard>
            <h2 className="text-lg font-bold mb-4">Ensemble Performance Metrics <span className="text-xs font-normal text-text-muted ml-2">(Weights: XGB 0.6 · LGB 0.2 · CAT 0.2)</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Mean Absolute Error (MAE)" value="36.40" unit="MWh" />
              <StatCard label="Root Mean Squared Error (RMSE)" value="48.67" unit="MWh" />
              <StatCard label="Mean Absolute % Error (MAPE)" value="0.405" unit="%" />
              <StatCard label="SHAP-Selected Features" value="30" unit="/ 72" />
            </div>
          </GlassCard>
        </div>

        {/* Data Splits & Timeline */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <GlassCard className="h-full">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icons.Calendar className="w-5 h-5" /> Data Splitting
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-sm text-text-secondary">Training Set</span>
                <span className="text-sm font-semibold text-text-primary bg-black/5 px-2 py-1 rounded">Dec 2016 – Jul 2020 · 30,710 rows</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-sm text-text-secondary">Validation Set</span>
                <span className="text-sm font-semibold text-text-primary bg-black/5 px-2 py-1 rounded">Jul 2020 – Apr 2021 · 6,581 rows</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-sm text-text-secondary">Test Set</span>
                <span className="text-sm font-semibold text-text-primary bg-black/5 px-2 py-1 rounded">Apr 2021 – Dec 2021 · 6,581 rows</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Total Dataset</span>
                <span className="text-sm font-semibold text-text-primary bg-black/5 px-2 py-1 rounded">43,872 hourly records</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Feature Engineering & Cleaning */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <GlassCard className="h-full">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icons.Database className="w-5 h-5" /> Engineering &amp; Cleaning
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Icons.CheckCircle2 className="w-4 h-4 text-text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Timestamps:</strong> Off-minute artefacts (12:05) rounded to the nearest hour automatically.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Icons.CheckCircle2 className="w-4 h-4 text-text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Anomaly Detection:</strong> IQR-based flagging (2.5×) adds <code>is_anomaly</code> + z-score. Rows kept — model learns from them.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Icons.CheckCircle2 className="w-4 h-4 text-text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Missing Data:</strong> Hourly reindex + time-interpolation fills gaps seamlessly.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Icons.CheckCircle2 className="w-4 h-4 text-text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Features:</strong> Lags (1h–168h), rolling stats, <code>is_holiday</code> (AU festivals), <code>is_weekend</code>, <code>is_morning</code>, <code>is_evening</code>, AU seasons, COVID-19 flag.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Icons.CheckCircle2 className="w-4 h-4 text-text-primary mt-0.5 flex-shrink-0" />
                <span><strong>SHAP Selection:</strong> Top 30 features via blended SHAP + ensemble importance — reduces model complexity without losing signal.</span>
              </li>
            </ul>
          </GlassCard>
        </div>

        {/* EDA Insights */}
        <div className="col-span-12 xl:col-span-4">
          <GlassCard className="h-full">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icons.Lightbulb className="w-5 h-5" /> Key EDA Insights
            </h2>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-black/5 border border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-1">🇦🇺 Australian Seasons</h3>
                <p className="text-sm text-text-secondary">Data perfectly aligns with Southern Hemisphere seasons. Winter (Jun–Aug) and Summer (Dec–Feb) show distinct bimodal peaks for heating &amp; cooling demand.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/5 border border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-1">🌅 Morning &amp; Evening Peaks</h3>
                <p className="text-sm text-text-secondary">Clear morning (6–12h) and evening (17–22h) demand spikes driven by residential routines — both are strong predictive features.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/5 border border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-1">📅 Holiday &amp; Weekend Dip</h3>
                <p className="text-sm text-text-secondary">Holidays avg <strong className="text-text-primary">9,804 MWh</strong> vs weekends at <strong className="text-text-primary">9,053 MWh</strong> — weekdays carry a <strong className="text-text-primary">+6.68%</strong> premium over weekends.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/5 border border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-1">🦠 COVID-19 Impact</h3>
                <p className="text-sm text-text-secondary">An unprecedented drop during 2020 lockdowns — the <code>is_covid</code> flag stands out as one of the top SHAP features.</p>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>
    </PageTransition>
  )
}
