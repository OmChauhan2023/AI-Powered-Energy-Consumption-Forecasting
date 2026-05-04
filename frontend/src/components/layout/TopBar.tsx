import { useLocation } from 'react-router-dom'
import { NAV_ITEMS } from '@/lib/constants'
import { useHealth } from '@/hooks/useHealth'
import { formatTimestamp, cn } from '@/lib/utils'

export function TopBar() {
  const location = useLocation()
  const { data: health } = useHealth()

  const title = NAV_ITEMS.find((item) => item.path === location.pathname)?.label || 'Dashboard'

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>

        <div className="flex items-center gap-6">
          {/* Health Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/5 border border-border">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                health?.status === 'healthy' ? 'bg-success animate-pulse-slow' : 'bg-danger'
              )}
            />
            <span className="text-xs text-text-secondary">
              {health?.status === 'healthy' ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Last Refresh */}
          <span className="text-xs text-text-muted">{formatTimestamp(health?.timestamp ?? null)}</span>
        </div>
      </div>
    </div>
  )
}
