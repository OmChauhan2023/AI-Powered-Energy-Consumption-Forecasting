import { useState, useEffect } from 'react'
import { Cloud, Droplets, Wind, Thermometer, Sun, AlertTriangle, RefreshCw, MapPin } from 'lucide-react'
import { api } from '@/api/endpoints'
import type { WeatherCurrentResponse } from '@/api/types'
import { cn } from '@/lib/utils'

const CITIES = [
  { key: 'sydney',    label: 'Sydney' },
  { key: 'melbourne', label: 'Melbourne' },
  { key: 'brisbane',  label: 'Brisbane' },
  { key: 'adelaide',  label: 'Adelaide' },
  { key: 'perth',     label: 'Perth' },
]

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  const cls = className ?? 'w-8 h-8'
  if (code === 0 || code === 1) return <Sun className={cn(cls, "text-yellow-500")} />
  if (code <= 3)                return <Cloud className={cn(cls, "text-slate-400")} />
  if (code <= 55)               return <Droplets className={cn(cls, "text-blue-400")} />
  if (code <= 65)               return <Droplets className={cn(cls, "text-blue-600")} />
  return <AlertTriangle className={cn(cls, "text-orange-500")} />
}

export function WeatherPanel() {
  const [city, setCity] = useState('sydney')
  const [weather, setWeather] = useState<WeatherCurrentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = async (selectedCity: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getWeatherCurrent(selectedCity)
      setWeather(data)
    } catch {
      setError('Could not reach weather service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather(city)
    const interval = setInterval(() => fetchWeather(city), 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [city])

  const getImpactStyles = (impact: string) => {
    if (impact.startsWith('🔴')) return 'bg-red-50 text-red-700 border-red-200'
    if (impact.startsWith('🟠')) return 'bg-orange-50 text-orange-700 border-orange-200'
    if (impact.startsWith('🟡')) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  if (loading && !weather) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-4" />
        <span className="text-sm font-semibold">Connecting to BOM Weather...</span>
      </div>
    )
  }

  if (error && !weather) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-semibold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        {error}
      </div>
    )
  }

  if (!weather) return null

  return (
    <div className="flex flex-col gap-4">
      {/* City Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-500">
          <MapPin className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Target Grid</span>
        </div>
        <select
          value={city}
          onChange={e => setCity(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-lg focus:ring-slate-900 focus:border-slate-900 block px-3 py-1.5 outline-none cursor-pointer"
        >
          {CITIES.map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Main Temperature */}
      <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <WeatherIcon code={weather.weather_code} className="w-12 h-12" />
        <div>
          <div className="text-3xl font-extrabold text-gray-900 leading-none mb-1">
            {weather.temperature}°C
          </div>
          <div className="text-sm font-semibold text-gray-500">
            Feels like {weather.apparent_temperature}°C · {weather.condition}
          </div>
        </div>
      </div>

      {/* Grid of secondary metrics */}
      <div className="grid grid-cols-2 gap-3">
        <WeatherStat icon={<Droplets className="w-4 h-4" />} label="Humidity" value={`${weather.humidity}%`} />
        <WeatherStat icon={<Wind className="w-4 h-4" />} label="Wind" value={`${weather.wind_speed} km/h`} />
        <WeatherStat icon={<Cloud className="w-4 h-4" />} label="Cloud Cover" value={`${weather.cloud_cover}%`} />
        <WeatherStat icon={<Thermometer className="w-4 h-4" />} label="Precip" value={`${weather.precipitation} mm`} />
      </div>

      {/* Critical Impact Banner */}
      <div className={cn("mt-2 rounded-xl p-4 border", getImpactStyles(weather.energy_impact))}>
        <div className="text-xs font-extrabold uppercase tracking-wider mb-1 opacity-80 flex items-center justify-between">
          <span>ML Feature Impact</span>
          <span className="text-xl leading-none">{weather.energy_impact.match(/^[🔴🟠🟡🟢]/)?.[0] || '⚡'}</span>
        </div>
        <div className="text-sm font-semibold leading-relaxed">
          {weather.energy_impact.replace(/^[🔴🟠🟡🟢]\s*/, '')}
        </div>
      </div>
    </div>
  )
}

function WeatherStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="text-gray-500">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-extrabold text-gray-900">{value}</div>
      </div>
    </div>
  )
}
