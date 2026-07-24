import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TrialSettings {
  autoApproveHosted: boolean;
  hostedDays: number;
  selfHostedDays: number;
  /** Days added after full product purchase (convert) */
  paidExtendDays?: number;
  /** Paid trial-extend pack */
  extendDays?: number;
  extendPriceBdt?: number;
  extendPriceUsd?: number;
  trialsEnabled?: boolean;
}

export function usePublicTrialConfig() {
  return useQuery({
    queryKey: ['publicTrialConfig'],
    queryFn: () => api.get<TrialSettings>('/trial/config'),
    staleTime: 60_000,
  });
}

export function useTrialSettings() {
  return useQuery({
    queryKey: ['trialSettings'],
    queryFn: () => api.get<TrialSettings>('/admin/settings/trial'),
  });
}

export function useUpdateTrialSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<TrialSettings>) => api.post('/admin/settings/trial', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trialSettings'] });
      qc.invalidateQueries({ queryKey: ['publicTrialConfig'] });
    },
  });
}

export function defaultDaysForType(settings: TrialSettings | undefined, trialType: string) {
  if (!settings) return 14;
  return trialType === 'self_hosted' ? settings.selfHostedDays : settings.hostedDays;
}
