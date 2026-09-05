import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Admin-facing settings shape (GET/POST /admin/settings/trial).
 * Mirrors trialSettings.js on the backend.
 */
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

  // Instant demo path
  demoEnabled?: boolean;
  demoMaxPerEmailDay?: number;
  demoMaxPerIpHour?: number;
  demoResetEnabled?: boolean;

  // Own-domain path
  domainEnabled?: boolean;
  domainMonths?: number[];
  defaultMonths?: number;
  hostingPurchaseEnabled?: boolean;
  fulfillmentSlaHours?: number;
}

/**
 * Public shape (GET /trial/config). Everything the storefront needs to render
 * the two trial paths truthfully — month presets come from here, never from
 * hard-coded copy.
 */
export interface PublicTrialConfig {
  trialsEnabled: boolean;
  demoEnabled: boolean;
  demoAccessDays: number;
  domainTrialEnabled: boolean;
  domainMonths: number[];
  defaultMonths: number;
  maxMonths: number;
  hostingPurchaseEnabled: boolean;
  fulfillmentSlaHours: number;
  // legacy
  hostedDays: number;
  selfHostedDays: number;
  autoApproveHosted: boolean;
  extendDays?: number;
  extendPriceBdt?: number;
  extendPriceUsd?: number;
  paidExtendDays?: number;
}

/** Used before the config request resolves so nothing renders "0 months". */
export const FALLBACK_PUBLIC_TRIAL_CONFIG: PublicTrialConfig = {
  trialsEnabled: true,
  demoEnabled: true,
  demoAccessDays: 14,
  domainTrialEnabled: true,
  domainMonths: [1],
  defaultMonths: 1,
  maxMonths: 3,
  hostingPurchaseEnabled: true,
  fulfillmentSlaHours: 24,
  hostedDays: 14,
  selfHostedDays: 30,
  autoApproveHosted: true,
};

export function usePublicTrialConfig() {
  return useQuery({
    queryKey: ['publicTrialConfig'],
    queryFn: () => api.get<PublicTrialConfig>('/trial/config'),
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
