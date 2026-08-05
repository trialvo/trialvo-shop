import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TrialAnalytics {
  instances: {
    total: number;
    active: number;
    frozen: number;
    expired: number;
    destroyed: number;
    provisioning: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
  requests: {
    pending: number;
    active: number;
    rejected: number;
    byStatus: Record<string, number>;
  };
  conversion: {
    paidConversions: number;
    conversionRatePct: number;
  };
  uptime: {
    healthyHeartbeats: number;
    staleInstances: number;
    monitored: number;
    healthyPct: number | null;
  };
  alerts: {
    expiringSoon: number;
    outdatedAgents: number;
  };
}

export function useTrialAnalytics() {
  return useQuery({
    queryKey: ['trialAnalytics'],
    queryFn: () => api.get<TrialAnalytics>('/admin/trial-instances/analytics'),
    refetchInterval: 60_000,
  });
}
