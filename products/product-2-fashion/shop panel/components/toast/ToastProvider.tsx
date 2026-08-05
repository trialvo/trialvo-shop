"use client";

import * as React from "react";
import { Toaster } from "sonner";

type Props = {
  children: React.ReactNode;
};

const ToasterProvider: React.FC<Props> = ({ children }) => {
  return (
    <>
      {children}

      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3500}
        offset={{ top: "72px", right: "14px" }}
        toastOptions={{
          classNames: {
            toast:
              "rounded-none border bg-[var(--toast-bg)] text-[var(--toast-text)] border-[var(--toast-border)] shadow-[0px_0px_12px_rgba(0,0,0,0.12)]",
            title: "text-sm font-semibold",
            description: "text-xs text-black/70 dark:text-white/70",
            actionButton:
              "rounded-none text-white px-3 py-2 text-xs font-medium",
            cancelButton:
              "rounded-none bg-transparent border border-[var(--toast-border)] px-3 py-2 text-xs font-medium",
          },
        }}
      />
    </>
  );
};

export default ToasterProvider;
