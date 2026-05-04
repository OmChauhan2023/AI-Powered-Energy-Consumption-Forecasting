import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/endpoints'
import { settingsStore } from '@/store/settingsStore'

export function useHealth() {
  const refreshInterval = settingsStore((s) => s.refreshInterval)

  return useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
    refetchInterval: refreshInterval * 1_000,
    staleTime: 0,
    retry: 1,
  })
}
