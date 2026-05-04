import { motion } from 'framer-motion'
import { useCountUp } from '@/hooks/useCountUp'
import { GlassCard } from './GlassCard'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number
  unit: string
  icon: LucideIcon
  trend?: { value: number; label: string }
}

export function MetricCard({ label, value, unit, icon: Icon, trend }: MetricCardProps) {
  const countedValue = useCountUp(value, { duration: 1500, decimals: 2 })

  return (
    <GlassCard className="animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-2xs font-bold text-text-muted uppercase tracking-widest">{label}</h3>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-hover">
          <Icon className="w-5 h-5 text-text-primary" />
        </div>
      </div>

      <motion.div className="mb-3">
        <p className="text-4xl font-black text-text-primary">{countedValue.toFixed(2)}</p>
      </motion.div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{unit}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trend.value > 0 ? 'text-danger' : 'text-success'}`}>
            {trend.value > 0 ? '↑' : '↓'} {trend.label}
          </span>
        )}
      </div>
    </GlassCard>
  )
}
