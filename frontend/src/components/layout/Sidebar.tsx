import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { NAV_ITEMS } from '@/lib/constants'
import { useHealth } from '@/hooks/useHealth'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { data: health } = useHealth()
  const location = useLocation()

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-border',
        'flex flex-col transition-all duration-300'
      )}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Logo Block */}
      <div className="p-4 pb-6">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
        >
          <Icons.Menu className="w-5 h-5" />
        </button>
        {!collapsed && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand">
                <Icons.Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-black text-gradient-brand">Energy</h1>
            </div>
            <p className="text-2xs text-text-muted tracking-widest">PRO ML DASHBOARD</p>
          </>
        )}
      </div>

      <div className="border-b border-border" />

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <div className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = Icons[item.icon as keyof typeof Icons] as any
            const isActive = location.pathname === item.path

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-btn transition-all duration-200',
                  isActive
                    ? 'bg-gradient-brand text-white shadow-glow'
                    : 'text-text-muted hover:bg-black/5 hover:text-text-primary'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            )
          })}
        </div>
      </nav>

      <div className="border-b border-border" />

      {/* Health Status */}
      <div className="p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-lg bg-black/5 px-3 py-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full animate-pulse-slow',
                health?.status === 'healthy' ? 'bg-success' : 'bg-danger'
              )}
            />
            <span className="text-2xs text-text-muted">
              {health?.status === 'healthy' ? 'Online' : 'Offline'}
            </span>
          </div>
        ) : (
          <div
            className={cn(
              'w-2 h-2 rounded-full animate-pulse-slow mx-auto',
              health?.status === 'healthy' ? 'bg-success' : 'bg-danger'
            )}
          />
        )}
      </div>
    </motion.aside>
  )
}
