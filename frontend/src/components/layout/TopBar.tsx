import { useLocation, Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { NAV_ITEMS } from '@/lib/constants'
import { useHealth } from '@/hooks/useHealth'
import { useCost } from '@/contexts/CostContext'
import { formatTimestamp, cn } from '@/lib/utils'

export function TopBar() {
  const location = useLocation()
  const { data: health } = useHealth()
  const { isCostMode, toggleCostMode } = useCost()

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3">
        
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-md">
            <Icons.Zap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:block">Eagle AI Energy Forecaster</span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-black/5 p-1 rounded-xl">
          {NAV_ITEMS.map((item) => {
            const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                  isActive 
                    ? 'bg-white text-text-primary shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right Status */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleCostMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 transition-colors text-xs font-semibold text-text-primary"
          >
            {isCostMode ? <Icons.DollarSign className="w-4 h-4 text-emerald-600" /> : <Icons.Zap className="w-4 h-4 text-blue-600" />}
            {isCostMode ? 'AUD ($)' : 'Energy (MWh)'}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/5 border border-border">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                health?.status === 'healthy' ? 'bg-success animate-pulse-slow' : 'bg-danger'
              )}
            />
            <span className="text-xs font-medium text-text-secondary">
              {health?.status === 'healthy' ? 'API Online' : 'Offline'}
            </span>
          </div>
          <span className="text-xs text-text-muted hidden lg:block">{formatTimestamp(health?.timestamp ?? null)}</span>
        </div>

      </div>
    </div>
  )
}
