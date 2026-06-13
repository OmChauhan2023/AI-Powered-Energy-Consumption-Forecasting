import { cn } from '@/lib/utils'

interface SliderFieldProps {
  label: string
  description?: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  formatLabel?: (value: number) => string
}

export function SliderField({ label, description, min, max, step = 1, value, onChange, formatLabel }: SliderFieldProps) {
  const displayValue = formatLabel ? formatLabel(value) : value

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-base font-extrabold text-gray-900">{label}</label>
        <span className="text-sm font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{displayValue}</span>
      </div>
      {description && (
        <p className="text-sm leading-relaxed text-gray-500 font-medium mb-3">
          {description}
        </p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'w-full h-2 bg-black/5 rounded-lg appearance-none cursor-pointer',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:bg-gradient-brand [&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-btn',
          '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-gradient-brand',
          '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0'
        )}
      />
    </div>
  )
}
