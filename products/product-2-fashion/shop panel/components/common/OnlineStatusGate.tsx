"use client";

import * as React from "react";

type Props = { children: React.ReactNode };

type ToastType = "offline" | "online" | null;

const BLOCKED_EVENTS: Array<keyof DocumentEventMap> = [
  "click",
  "auxclick",
  "dblclick",
  "contextmenu",

  "pointerdown",
  "pointerup",
  "mousedown",
  "mouseup",

  "keydown",
  "keyup",
  "keypress",
];

const BLOCKED_TOUCH_EVENTS: Array<keyof DocumentEventMap> = ["touchstart", "touchend"];

function stopEvent(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  if ("stopImmediatePropagation" in event) {
    (event as Event & { stopImmediatePropagation: () => void }).stopImmediatePropagation();
  }
}

const OnlineStatusGate: React.FC<Props> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);

  const [toast, setToast] = React.useState<ToastType>(null);
  const toastTimerRef = React.useRef<number | null>(null);

  const showToast = React.useCallback((type: ToastType) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setToast(type);

    if (type === "online") {
      toastTimerRef.current = window.setTimeout(() => setToast(null), 2500);
    }
  }, []);

  React.useEffect(() => {
    setMounted(true);

    const sync = () => {
      const nowOnline = navigator.onLine;
      setIsOnline(nowOnline);
      showToast(nowOnline ? null : "offline");
    };

    const handleOnline = () => {
      setIsOnline(true);
      showToast("online");
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast("offline");
    };

    sync();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    };
  }, [showToast]);

  React.useEffect(() => {
    if (!mounted) return;
    if (isOnline) return;

    const handler: EventListener = (event) => stopEvent(event);

    const options: AddEventListenerOptions = { capture: true, passive: false };

    for (const type of BLOCKED_EVENTS) {
      document.addEventListener(type, handler, options);
    }
    for (const type of BLOCKED_TOUCH_EVENTS) {
      document.addEventListener(type, handler, options);
    }

    return () => {
      for (const type of BLOCKED_EVENTS) {
        document.removeEventListener(type, handler, options);
      }
      for (const type of BLOCKED_TOUCH_EVENTS) {
        document.removeEventListener(type, handler, options);
      }
    };
  }, [isOnline, mounted]);

  if (!mounted) return <>{children}</>;

  const showOffline = toast === "offline" && !isOnline;
  const showOnline = toast === "online" && isOnline;

  return (
    <>
      <div
        aria-live="polite"
        aria-atomic="true"
        className={[
          "fixed left-1/2 top-4 z-[9999] -translate-x-1/2",
          "w-full sm:w-fit sm:max-w-[92vw] rounded-full border px-4 py-2 text-xs font-medium shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
          "backdrop-blur transition-all duration-300 ease-out",
          showOffline || showOnline
            ? "translate-y-0 opacity-100"
            : "-translate-y-3 opacity-0 pointer-events-none",
          showOffline
            ? "border-red-500/25 bg-gradient-to-r from-red-500/15 via-red-500/5 to-red-500/15 text-red-700"
            : "border-emerald-500/25 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-emerald-500/15 text-emerald-700",
        ].join(" ")}
      >
        {showOffline ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            You are offline. Actions are disabled.
          </span>
        ) : showOnline ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Back online. Everything is working again.
          </span>
        ) : null}
      </div>

      <div
        aria-hidden={isOnline ? "true" : "false"}
        className={[
          "fixed inset-0 z-[9998] bg-transparent transition-opacity duration-300 ease-out",
          isOnline ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100",
        ].join(" ")}
      />

      {children}
    </>
  );
};

export default OnlineStatusGate;
