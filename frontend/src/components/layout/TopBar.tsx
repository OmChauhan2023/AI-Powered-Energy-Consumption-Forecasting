import { Link, useLocation } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/endpoints'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/constants'

export function TopBar() {
  const location = useLocation()
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
    refetchInterval: 30000,
  })

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="flex h-16 items-center px-6">
        
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="bg-black p-2 rounded-xl flex items-center justify-center">
            <Icons.Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm leading-tight text-gray-900 tracking-tight">Eagle AI Energy</span>
            <span className="font-extrabold text-sm leading-tight text-gray-900 tracking-tight">Forecaster</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-8 ml-16 h-full">
          {NAV_ITEMS.map((item) => {
            const Icon = Icons[item.icon as keyof typeof Icons] as any
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex items-center gap-2 h-full text-sm font-semibold transition-colors',
                  isActive ? 'text-black' : 'text-gray-500 hover:text-black'
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-black" : "text-gray-400")} />
                <span>{item.label}</span>
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black rounded-t-full" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-gray-50/50">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse-slow shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
              )}
            />
            <span className="text-xs font-bold text-gray-600">
              {health?.status === 'healthy' ? 'API Online' : 'Offline'}
            </span>
          </div>

        </div>
      </div>
    </header>
  )
}
