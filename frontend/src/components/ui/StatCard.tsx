import { GlassCard } from './GlassCard'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
}

export function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <GlassCard padding="sm" className="text-center">
      <p className="text-2xs text-text-muted uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-text-primary">{value}</p>
      {unit && <p className="text-2xs text-text-faint mt-1">{unit}</p>}
    </GlassCard>
  )
}
