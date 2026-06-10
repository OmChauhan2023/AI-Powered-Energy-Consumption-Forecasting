import { useState, useEffect } from 'react'
import { Cloud, Droplets, Wind, Thermometer, Sun, AlertTriangle, RefreshCw } from 'lucide-react'
import { api } from '@/api/endpoints'
import type { WeatherCurrentResponse } from '@/api/types'

const CITIES = [
  { key: 'sydney',    label: 'Sydney' },
  { key: 'melbourne', label: 'Melbourne' },
  { key: 'brisbane',  label: 'Brisbane' },
  { key: 'adelaide',  label: 'Adelaide' },
  { key: 'perth',     label: 'Perth' },
]

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  const cls = className ?? 'w-8 h-8'
  if (code === 0 || code === 1) return <Sun className={cls} style={{ color: '#fbbf24' }} />
  if (code <= 3)                return <Cloud className={cls} style={{ color: '#94a3b8' }} />
  if (code <= 55)               return <Droplets className={cls} style={{ color: '#60a5fa' }} />
  if (code <= 65)               return <Droplets className={cls} style={{ color: '#3b82f6' }} />
  return <AlertTriangle className={cls} style={{ color: '#f97316' }} />
}

export function WeatherPanel() {
  const [city, setCity] = useState('sydney')
  const [weather, setWeather] = useState<WeatherCurrentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchWeather = async (selectedCity: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getWeatherCurrent(selectedCity)
      setWeather(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError('Could not reach weather service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather(city)
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => fetchWeather(city), 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [city])

  const impactColor = (impact: string) => {
    if (impact.startsWith('🔴')) return '#ef4444'
    if (impact.startsWith('🟠')) return '#f97316'
    if (impact.startsWith('🟡')) return '#eab308'
    return '#22c55e'
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(99,102,241,0.10) 100%)',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: '1rem',
      padding: '1.5rem',
      backdropFilter: 'blur(12px)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blob */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '120px', height: '120px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>🌤️ Live Weather</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* City selector */}
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '0.5rem',
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            {CITIES.map(c => (
              <option key={c.key} value={c.key} style={{ background: '#1e293b' }}>{c.label}</option>
            ))}
          </select>
          {/* Refresh button */}
          <button
            onClick={() => fetchWeather(city)}
            title="Refresh weather"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '0.5rem',
              padding: '0.3rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'inherit',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && !weather && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <RefreshCw size={24} className="animate-spin" style={{ opacity: 0.5 }} />
        </div>
      )}

      {error && !weather && (
        <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
          ⚠️ {error}
        </div>
      )}

      {weather && (
        <>
          {/* Main temperature + icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <WeatherIcon code={weather.weather_code} className="w-12 h-12" />
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>
                {weather.temperature}°C
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.65, marginTop: '0.15rem' }}>
                Feels like {weather.apparent_temperature}°C · {weather.condition}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.1rem' }}>
                {weather.city}
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <WeatherStat icon={<Droplets size={14} />} label="Humidity" value={`${weather.humidity}%`} />
            <WeatherStat icon={<Wind size={14} />} label="Wind" value={`${weather.wind_speed} km/h`} />
            <WeatherStat icon={<Cloud size={14} />} label="Cloud Cover" value={`${weather.cloud_cover}%`} />
            <WeatherStat icon={<Thermometer size={14} />} label="Precipitation" value={`${weather.precipitation} mm`} />
          </div>

          {/* Energy impact */}
          <div style={{
            background: `${impactColor(weather.energy_impact)}18`,
            border: `1px solid ${impactColor(weather.energy_impact)}40`,
            borderRadius: '0.6rem',
            padding: '0.6rem 0.8rem',
            fontSize: '0.78rem',
            lineHeight: 1.4,
          }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.1rem', opacity: 0.7 }}>
              ENERGY DEMAND IMPACT
            </span>
            {weather.energy_impact}
          </div>

          {/* Footer */}
          <div style={{ fontSize: '0.68rem', opacity: 0.35, marginTop: '0.75rem', textAlign: 'right' }}>
            {weather.source} · {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ''}
          </div>
        </>
      )}
    </div>
  )
}

function WeatherStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '0.5rem',
      padding: '0.5rem 0.65rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
    }}>
      <span style={{ opacity: 0.5 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  )
}
