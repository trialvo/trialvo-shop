import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBulkRules, createBulkRule, editBulkRule, deleteBulkRule,
  getComboRules, createComboRule, editComboRule, deleteComboRule,
  type BulkRulePayload, type ComboRulePayload,
} from "@/api/discount-rules.api";

const bulkKeys = { all: ["bulk-rules"] as const };
const comboKeys = { all: ["combo-rules"] as const };

export function useBulkRules() {
  return useQuery({ queryKey: bulkKeys.all, queryFn: getBulkRules });
}
export function useCreateBulkRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createBulkRule, onSuccess: () => qc.invalidateQueries({ queryKey: bulkKeys.all }) });
}
export function useEditBulkRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<BulkRulePayload> }) => editBulkRule(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: bulkKeys.all }),
  });
}
export function useDeleteBulkRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteBulkRule, onSuccess: () => qc.invalidateQueries({ queryKey: bulkKeys.all }) });
}

export function useComboRules() {
  return useQuery({ queryKey: comboKeys.all, queryFn: getComboRules });
}
export function useCreateComboRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createComboRule, onSuccess: () => qc.invalidateQueries({ queryKey: comboKeys.all }) });
}
export function useEditComboRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<ComboRulePayload> }) => editComboRule(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: comboKeys.all }),
  });
}
export function useDeleteComboRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteComboRule, onSuccess: () => qc.invalidateQueries({ queryKey: comboKeys.all }) });
}
