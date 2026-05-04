import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMWh(value: number, decimals = 2): string {
  return `${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} MWh`
}

export function formatPct(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}

export function formatTimestamp(ts: string | null): string {
  if (!ts) return 'Never'
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function hourLabel(h: number): string {
  const period = h < 12 ? 'AM' : 'PM'
  const displayH = h % 12 === 0 ? 12 : h % 12
  return `${displayH}${period}`
}

export function dayLabel(d: number): string {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days[d] || ''
}

export function monthLabel(m: number): string {
  return new Date(0, m - 1).toLocaleString('en', { month: 'short' })
}

export function generateMockHistory(points = 168): { time: string; value: number }[] {
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => {
    const ts = new Date(now - (points - i) * 3_600_000)
    const hour = ts.getHours()
    const base = 10_500
    const dailySwing = 800 * Math.sin(((hour - 6) * Math.PI) / 12)
    const noise = (Math.random() - 0.5) * 300
    return { time: ts.toISOString(), value: +(base + dailySwing + noise).toFixed(1) }
  })
}

export function generateHourlyPattern(): { hour: number; label: string; avg: number }[] {
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: hourLabel(h),
    avg: +(10_000 + 1_500 * Math.sin(((h - 6) * Math.PI) / 12)).toFixed(1),
  }))
}
