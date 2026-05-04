import * as Icons from 'lucide-react'
import { formatTimestamp, cn } from '@/lib/utils'
import type { Alert } from '@/api/types'

interface AlertItemProps {
  alert: Alert
}

export function AlertItem({ alert }: AlertItemProps) {
  const Icon =
    alert.type === 'error'
      ? Icons.XCircle
      : alert.type === 'warning'
        ? Icons.AlertTriangle
        : Icons.AlertCircle

  const borderColor = {
    error: 'border-l-danger',
    warning: 'border-l-warning',
    info: 'border-l-info',
  }[alert.type]

  const bgColor = {
    error: 'bg-danger/10',
    warning: 'bg-warning/10',
    info: 'bg-info/10',
  }[alert.type]

  return (
    <div className={cn('border-l-4 rounded-lg px-4 py-3 mb-2', borderColor, bgColor)}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{alert.message}</p>
          <p className="text-2xs text-text-muted mt-1">{formatTimestamp(alert.timestamp)}</p>
        </div>
      </div>
    </div>
  )
}
