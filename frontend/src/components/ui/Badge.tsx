import { cn } from '@/lib/utils'

interface BadgeProps {
  variant: 'online' | 'offline' | 'warning' | 'info'
  label: string
}

export function Badge({ variant, label }: BadgeProps) {
  const styles = {
    online: 'bg-success/10 border-success/30 text-success',
    offline: 'bg-danger/10 border-danger/30 text-danger',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    info: 'bg-info/10 border-info/30 text-info',
  }
  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium', styles[variant])}>
      <div
        className={cn('w-2 h-2 rounded-full', {
          'animate-pulse-slow': variant === 'online',
        })}
        style={{
          backgroundColor:
            variant === 'online'
              ? '#00d4aa'
              : variant === 'offline'
                ? '#ff6b6b'
                : variant === 'warning'
                  ? '#ffa502'
                  : '#667eea',
        }}
      />
      <span>{label}</span>
    </div>
  )
}
