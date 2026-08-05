import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPolicies,
  getPolicyByKey,
  savePolicy,
  deletePolicy,
  patchPolicy,
} from "@/api/policies.api";
import type { PatchPolicyBody } from "@/api/policies.api";

export const policyKeys = {
  all: ["policies"] as const,
  one: (key: string) => ["policies", key] as const,
};

export function usePolicies() {
  return useQuery({ queryKey: policyKeys.all, queryFn: getPolicies });
}

export function usePolicyByKey(key: string | null) {
  return useQuery({
    queryKey: key ? policyKeys.one(key) : policyKeys.all,
    queryFn: () => getPolicyByKey(key!),
    enabled: Boolean(key),
  });
}

export function useSavePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: savePolicy,
    onSuccess: () => qc.invalidateQueries({ queryKey: policyKeys.all }),
  });
}

export function useDeletePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePolicy,
    onSuccess: () => qc.invalidateQueries({ queryKey: policyKeys.all }),
  });
}

export function usePatchPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, body }: { key: string; body: PatchPolicyBody }) =>
      patchPolicy(key, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: policyKeys.all }),
  });
}
