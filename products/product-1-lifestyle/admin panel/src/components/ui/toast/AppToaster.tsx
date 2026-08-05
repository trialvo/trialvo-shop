"use client";

import React from "react";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import { AlertTriangle, Check, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  position?:
    | "top-right"
    | "top-center"
    | "top-left"
    | "bottom-right"
    | "bottom-center"
    | "bottom-left";
  /** Extra top offset (px) below the sticky header. */
  offsetTopPx?: number;
};

type Tone = {
  glow: string;
  badgeBg: string;
  badgeRing: string;
  badgeIcon: React.ReactNode;
  title: string;
};

function getTone(type: string): Tone {
  switch (type) {
    case "success":
      return {
        glow: "from-success-500/22 via-success-500/10 to-transparent",
        badgeBg: "bg-success-500",
        badgeRing: "ring-success-500/30",
        badgeIcon: <Check className="h-4 w-4 text-gray-900" />,
        title: "Success",
      };
    case "error":
      return {
        glow: "from-error-500/22 via-error-500/10 to-transparent",
        badgeBg: "bg-error-500",
        badgeRing: "ring-error-500/30",
        badgeIcon: <X className="h-4 w-4 text-gray-900" />,
        title: "Error",
      };
    case "loading":
      return {
        glow: "from-brand-500/22 via-brand-500/10 to-transparent",
        badgeBg: "bg-brand-500",
        badgeRing: "ring-brand-500/30",
        badgeIcon: <Info className="h-4 w-4 text-gray-900" />,
        title: "Working...",
      };
    default:
      return {
        glow: "from-warning-500/22 via-warning-500/10 to-transparent",
        badgeBg: "bg-warning-500",
        badgeRing: "ring-warning-500/30",
        badgeIcon: <AlertTriangle className="h-4 w-4 text-gray-900" />,
        title: "Notice",
      };
  }
}

function getToastText(message: React.ReactNode): string {
  if (typeof message === "string") return message;

  if (React.isValidElement(message)) {
    const children = (message.props as { children?: React.ReactNode })?.children;

    if (typeof children === "string") return children;

    if (Array.isArray(children)) {
      const firstText = children.find((c) => typeof c === "string");
      if (typeof firstText === "string") return firstText;
    }
  }

  return "";
}

export default function AppToaster({ position = "top-right", offsetTopPx = 12 }: Props) {
  return (
    <Toaster
      position={position}
      gutter={10}
      containerStyle={{
        top: `calc(var(--app-header-height, 72px) + ${offsetTopPx}px)`,
        zIndex: 999999999,
      }}
      toastOptions={{
        duration: 10000,
        className: cn("!bg-transparent !p-0 !shadow-none"),
      }}
    >
      {(t) => {
        const tone = getTone(t.type);

        const motionClass = t.visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0";

        return (
          <ToastBar toast={t} style={{ padding: 0, background: "transparent" }}>
            {({ message }) => {
              const text = getToastText(message);

              return (
                <div
                  className={cn(
                    "relative w-[460px] max-w-[calc(100vw-20px)] overflow-hidden",
                    "rounded-2xl border border-gray-200/10",
                    "bg-gray-900/95 text-white shadow-2xl",
                    "ring-1 ring-black/10 dark:ring-white/5",
                    "backdrop-blur supports-[backdrop-filter]:bg-gray-900/80",
                    "transform transition-[transform,opacity] duration-300 ease-out",
                    motionClass
                  )}
                  role={t.type === "error" ? "alert" : "status"}
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full blur-3xl",
                      "bg-gradient-to-br",
                      tone.glow
                    )}
                    aria-hidden="true"
                  />
                  <div
                    className={cn(
                      "pointer-events-none absolute -right-20 -bottom-20 h-56 w-56 rounded-full blur-3xl",
                      "bg-gradient-to-tr from-white/6 via-white/0 to-transparent"
                    )}
                    aria-hidden="true"
                  />

                  <div className="relative flex items-start gap-3 px-2 py-2">
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        "bg-white/10 ring-6 ring-white/5"
                      )}
                      aria-hidden="true"
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full",
                          tone.badgeBg,
                          "ring-1 ring-black/10",
                          tone.badgeRing
                        )}
                      >
                        {tone.badgeIcon}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <div className="truncate text-base font-semibold tracking-[-0.015em]">
                        {tone.title}
                      </div>

                      <div className="mt-0.5 text-sm leading-relaxed text-white/65">{text}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toast.dismiss(t.id)}
                      className={cn(
                        "ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        "bg-white/5 text-white/70 ring-1 ring-white/10",
                        "hover:bg-white/10 hover:text-white",
                        "transition-colors"
                      )}
                      aria-label="Dismiss"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            }}
          </ToastBar>
        );
      }}
    </Toaster>
  );
}
