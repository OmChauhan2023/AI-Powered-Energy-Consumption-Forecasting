import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/endpoints'

export function useTrainingStatus() {
  return useQuery({
    queryKey: ['training-status'],
    queryFn: api.getTrainingStatus,
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.training_in_progress ? 5_000 : 30_000),
  })
}
