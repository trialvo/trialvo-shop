"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";

import { contactService, type ContactPayload } from "@/lib/api/contact/service";

export const useContact = () => {
  const mutation = useMutation({
    mutationFn: (payload: ContactPayload) => contactService.submitContact(payload),
  });

  const submitContact = useCallback(
    (payload: ContactPayload) => mutation.mutateAsync(payload),
    [mutation],
  );

  return {
    submitContact,
    isSubmitting: mutation.isPending,
  };
};
