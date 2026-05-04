import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg'
}

export function GlassCard({ children, className, onClick, padding = 'md' }: GlassCardProps) {
  const paddingClass = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  }[padding]

  return (
    <motion.div
      className={cn(
        'bg-card rounded-card shadow-card border border-border transition-all duration-300',
        'hover:shadow-card-hover',
        paddingClass,
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}
