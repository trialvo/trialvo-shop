import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllSubscribers,
  toggleSubscription,
  toggleBanSubscriber,
} from "@/api/subscribers.api";
import type { GetSubscribersParams } from "@/api/subscribers.api";

export const subscriberKeys = {
  all: (params: GetSubscribersParams) => ["subscribers", params] as const,
};

export function useSubscribers(params: GetSubscribersParams) {
  return useQuery({
    queryKey: subscriberKeys.all(params),
    queryFn: () => getAllSubscribers(params),
    placeholderData: (prev) => prev, // keep previous data while fetching
  });
}

export function useToggleSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      toggleSubscription(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscribers"] }),
  });
}

export function useToggleBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reason,
      effect_linked_account,
    }: {
      id: number;
      reason?: string;
      effect_linked_account?: boolean;
    }) => toggleBanSubscriber(id, { reason, effect_linked_account }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscribers"] }),
  });
}
