import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TrialSettings {
  autoApproveHosted: boolean;
  hostedDays: number;
  selfHostedDays: number;
  paidExtendDays?: number;
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trialSettings'] }),
  });
}

export function defaultDaysForType(settings: TrialSettings | undefined, trialType: string) {
  if (!settings) return 14;
  return trialType === 'self_hosted' ? settings.selfHostedDays : settings.hostedDays;
}
