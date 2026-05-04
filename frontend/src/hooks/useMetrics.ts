import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/endpoints'

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: api.getMetrics,
    staleTime: 30_000,
    retry: 2,
  })
}
