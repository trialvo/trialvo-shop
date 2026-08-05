// src/components/business-settings/service-settings/TestSmsCard.tsx
"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { cn } from "@/lib/utils";

import { testSms } from "@/api/service-config.api";

type Props = {
  activeProviderLabel: string;
  variant?: "card" | "modal";
};

export default function TestSmsCard({ activeProviderLabel, variant = "card" }: Props) {
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("This is a testing message from developer");

  const canSend = useMemo(() => {
    return Boolean(number.trim() && message.trim());
  }, [number, message]);

  const mutation = useMutation({
    mutationFn: (payload: { number: string; message: string }) => testSms(payload),
    onSuccess: (res: any) => {
      if (res?.success === true || res?.status === true) {
        toast.success("Test SMS sent");
        return;
      }
      toast.error(res?.error ?? res?.message ?? "Failed to send SMS");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to send SMS";
      toast.error(msg);
    },
  });

  const submit = () => {
    mutation.mutate({
      number: number.trim(),
      message: message.trim(),
    });
  };

  const form = (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Number</p>
        <Input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="01629615314"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</p>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="This is a testing message from developer"
        />
      </div>
    </div>
  );

  if (variant === "modal") {
    return (
      <div className="space-y-5">
        {form}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Active provider:{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {activeProviderLabel}
            </span>
          </p>
          <Button
            onClick={submit}
            disabled={mutation.isPending || !canSend}
            className={cn("inline-flex items-center gap-2")}
          >
            <Send size={16} />
            {mutation.isPending ? "Sending..." : "Send Test"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Test SMS</h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            This will send using current active provider:{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {activeProviderLabel}
            </span>
          </p>
        </div>

        <Button
          onClick={submit}
          disabled={mutation.isPending || !canSend}
          className={cn("inline-flex items-center gap-2")}
        >
          <Send size={16} />
          {mutation.isPending ? "Sending..." : "Send Test"}
        </Button>
      </div>

      <div className="mt-5">{form}</div>
    </div>
  );
}
