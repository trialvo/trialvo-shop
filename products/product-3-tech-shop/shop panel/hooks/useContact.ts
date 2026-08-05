"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  contactService,
  type ContactPayload,
  type ContactResponse,
} from "@/lib/api/contact/service";

/**
 * Contact form mutation — wraps POST /contact-message.
 */
export function useContact() {
  const mutation = useMutation<ContactResponse, Error, ContactPayload>({
    mutationFn: (payload) => contactService.submitContact(payload),
  });

  const submitContact = useCallback(
    (payload: ContactPayload) => mutation.mutateAsync(payload),
    [mutation],
  );

  return {
    submitContact,
    isSubmitting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export default useContact;
