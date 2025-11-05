import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchesAPI } from '../services/api';
import toast from 'react-hot-toast';

// Query keys
export const matchesKeys = {
  all: ['matches'] as const,
  lists: () => [...matchesKeys.all, 'list'] as const,
  list: (filters: any) => [...matchesKeys.lists(), filters] as const,
  details: () => [...matchesKeys.all, 'detail'] as const,
  detail: (id: number) => [...matchesKeys.details(), id] as const,
  insights: (id: number) => [...matchesKeys.detail(id), 'insights'] as const,
};

// Hook to fetch matches with filters
// Auto-refreshes every 30 seconds for live matches, 5 minutes for others
export function useMatches(filters?: {
  league?: number;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const isLiveFilter = filters?.status === 'LIVE';
  const isTodayMatches = filters?.date === new Date().toISOString().split('T')[0];

  // Auto-refresh live matches more frequently
  const refetchInterval = isLiveFilter || isTodayMatches ? 30000 : 300000; // 30s for live/today, 5min for others

  return useQuery({
    queryKey: matchesKeys.list(filters),
    queryFn: () => matchesAPI.getMatches(filters),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval, // Auto-refresh in background
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not focused
  });
}

// Hook to fetch a single match
// Auto-refreshes based on match status: 20s for live, 5min for others
export function useMatch(id: number) {
  const query = useQuery({
    queryKey: matchesKeys.detail(id),
    queryFn: () => matchesAPI.getMatchById(id),
    enabled: !!id,
    staleTime: 1000 * 20, // 20 seconds for match details
  });

  const match = query.data;
  const isLive = match?.status === 'LIVE' || match?.status === 'HT';

  // Determine refresh interval based on match status
  const refetchInterval = isLive ? 20000 : 300000; // 20s for live, 5min for others

  return useQuery({
    queryKey: matchesKeys.detail(id),
    queryFn: () => matchesAPI.getMatchById(id),
    enabled: !!id,
    staleTime: 1000 * 20,
    refetchInterval, // Auto-refresh based on status
    refetchIntervalInBackground: true,
  });
}

// Hook to fetch match insights
export function useMatchInsights(id: number) {
  return useQuery({
    queryKey: matchesKeys.insights(id),
    queryFn: () => matchesAPI.getMatchInsights(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes for insights
  });
}

// Hook to generate AI insight
export function useGenerateInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matchId,
      type,
      deepAnalysis = false
    }: {
      matchId: number;
      type: 'pre_match' | 'halftime' | 'post_match';
      deepAnalysis?: boolean;
    }) => matchesAPI.generateInsight(matchId, type, deepAnalysis),
    onSuccess: (data, variables) => {
      // Invalidate insights cache to refetch
      queryClient.invalidateQueries({ queryKey: matchesKeys.insights(variables.matchId) });
      toast.success('AI insight generated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate insight');
    },
  });
}

// Hook to sync today's matches
export function useSyncTodayMatches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => matchesAPI.syncToday(),
    onSuccess: () => {
      // Invalidate all match lists
      queryClient.invalidateQueries({ queryKey: matchesKeys.lists() });
      toast.success('Matches synced successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to sync matches');
    },
  });
}

// Hook to sync date range
export function useSyncDateRange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) =>
      matchesAPI.syncDateRange(dateFrom, dateTo),
    onSuccess: () => {
      // Invalidate all match lists
      queryClient.invalidateQueries({ queryKey: matchesKeys.lists() });
      toast.success('Historical matches synced!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to sync matches');
    },
  });
}
