import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  apiUrl: string
  refreshInterval: number
  setApiUrl: (url: string) => void
  setRefreshInterval: (s: number) => void
}

export const settingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiUrl: 'http://localhost:8000',
      refreshInterval: 30,
      setApiUrl: (apiUrl) => set({ apiUrl }),
      setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
    }),
    { name: 'energy-settings' }
  )
)
