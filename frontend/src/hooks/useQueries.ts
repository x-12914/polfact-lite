import { useQuery } from '@tanstack/react-query';
import { getPOIs, getPOIFull, getClaims, getSources, getStats, getRecentActivity } from '../services/api';

export function usePOIs() {
  return useQuery({
    queryKey: ['pois'],
    queryFn: () => getPOIs(),
    refetchInterval: 30000, // Poll every 30 seconds for dashboard updates
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => getStats(),
    refetchInterval: 10000, // Faster polling for global stats (every 10s)
  });
}

export function useActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: () => getRecentActivity(),
    refetchInterval: 5000, // Poll activity every 5 seconds
  });
}

export function usePOI(id: string | number | undefined) {
  return useQuery({
    queryKey: ['poi', id],
    queryFn: () => getPOIFull(id!),
    enabled: !!id,
  });
}

export function useClaims(poiId: string | number | undefined) {
  return useQuery({
    queryKey: ['claims', poiId || 'all'],
    queryFn: () => getClaims(poiId),
    enabled: true,
  });
}

export function useSources(claimId?: number) {
  return useQuery({
    queryKey: ['sources', claimId || 'all'],
    queryFn: () => getSources(claimId),
  });
}
