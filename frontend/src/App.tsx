import { useLocation } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { TopBar } from '@/components/layout/TopBar'

import { Navigate } from 'react-router-dom'
import PredictorPortal from '@/pages/PredictorPortal'
import Forecaster from '@/pages/Forecaster'
import PlatformAnalytics from '@/pages/PlatformAnalytics'
import Monitoring from '@/pages/Monitoring'
import Training from '@/pages/Training'
import Settings from '@/pages/Settings'

export default function App() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-gradient-surface text-text-primary font-sans">
      <div className="flex-1 flex flex-col transition-all duration-300">
        <TopBar />

        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PredictorPortal />} />
              <Route path="/forecast" element={<Forecaster />} />
              <Route path="/analytics" element={<PlatformAnalytics />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/training" element={<Training />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
