import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFirebaseCredential,
  saveFirebaseCredential,
  toggleFirebaseCredential,
  clearFirebaseCredential,
} from "@/api/firebase-config.api";

export const firebaseConfigKeys = {
  credential: ["firebase-credential"] as const,
};

export function useFirebaseCredential() {
  return useQuery({
    queryKey: firebaseConfigKeys.credential,
    queryFn: getFirebaseCredential,
  });
}

export function useSaveFirebaseCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveFirebaseCredential,
    onSuccess: () => qc.invalidateQueries({ queryKey: firebaseConfigKeys.credential }),
  });
}

export function useToggleFirebaseCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleFirebaseCredential,
    onSuccess: () => qc.invalidateQueries({ queryKey: firebaseConfigKeys.credential }),
  });
}

export function useClearFirebaseCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearFirebaseCredential,
    onSuccess: () => qc.invalidateQueries({ queryKey: firebaseConfigKeys.credential }),
  });
}

