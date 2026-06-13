import { createContext, useContext, useState, ReactNode } from 'react'

type CostContextType = {
  isCostMode: boolean
  toggleCostMode: () => void
  rate: number // AUD per MWh
  formatValue: (value: number | undefined | null) => string
}

const CostContext = createContext<CostContextType | undefined>(undefined)

export function CostProvider({ children }: { children: ReactNode }) {
  const [isCostMode, setIsCostMode] = useState(false)
  const rate = 100 // $100 AUD per MWh

  const toggleCostMode = () => setIsCostMode((prev) => !prev)

  const formatValue = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '--'
    if (isCostMode) {
      return `$${(value * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    }
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} MWh`
  }

  return (
    <CostContext.Provider value={{ isCostMode, toggleCostMode, rate, formatValue }}>
      {children}
    </CostContext.Provider>
  )
}

export function useCost() {
  const context = useContext(CostContext)
  if (context === undefined) {
    throw new Error('useCost must be used within a CostProvider')
  }
  return context
}
