import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScenarioButtonProps {
  label: string
  icon: string
  isActive: boolean
  onClick: () => void
}

export function ScenarioButton({ label, icon, isActive, onClick }: ScenarioButtonProps) {
  const Icon = Icons[icon as keyof typeof Icons] as any

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'flex flex-row items-center justify-center gap-1.5 px-3 py-2 rounded-btn border transition-all duration-200',
        isActive
          ? 'bg-gradient-brand text-white border-brand-from shadow-btn'
          : 'border-border text-text-muted hover:border-brand-from hover:text-text-primary'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </motion.button>
  )
}
