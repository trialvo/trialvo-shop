"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";

import { subscribeService, type SubscribePayload } from "@/lib/api/subscribe/service";

export const useSubscribe = () => {
  const mutation = useMutation({
    mutationFn: (payload: SubscribePayload) => subscribeService.subscribe(payload),
  });

  const subscribe = useCallback(
    (payload: SubscribePayload) => mutation.mutateAsync(payload),
    [mutation],
  );

  return {
    subscribe,
    isSubscribing: mutation.isPending,
    subscribeError: mutation.error,
  };
};
