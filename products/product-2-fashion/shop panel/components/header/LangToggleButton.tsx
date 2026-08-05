"use client";

import { useLanguage } from "@/providers/LanguageProvider";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const LangToggleButton: React.FC = () => {
  const { language, setLanguage, isLangReady } = useLanguage();
  const isBn = language === "bn";

  const segmentStyle = (active: boolean): React.CSSProperties => ({
    position: "relative",
    zIndex: 1,
    display: "grid",
    placeItems: "center",
    height: 26,
    minWidth: 52,
    padding: "0 10px",
    borderRadius: 2,
    cursor: "pointer",
    userSelect: "none",
    transition: "background-color 180ms, color 180ms",
    backgroundColor: active ? "#111" : "transparent",
    color: active ? "#fff" : "var(--muted-foreground)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    WebkitFontSmoothing: "antialiased",
  });

  if (!isLangReady) {
    return <Skeleton className="h-8 w-[120px] rounded" />;
  }

  return (
    <div
      role="group"
      aria-label="Language switcher"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: 3,
        height: 32,
        background: "var(--muted)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      {/* বাংলা */}
      <div
        role="button"
        tabIndex={0}
        aria-pressed={isBn}
        aria-label="বাংলায় দেখুন"
        onClick={() => setLanguage("bn")}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setLanguage("bn")}
        style={{
          ...segmentStyle(isBn),
          fontFamily: "var(--font-hind-siliguri, sans-serif)",
        }}
      >
        বাংলা
      </div>

      {/* English */}
      <div
        role="button"
        tabIndex={0}
        aria-pressed={!isBn}
        aria-label="Switch to English"
        onClick={() => setLanguage("en")}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setLanguage("en")}
        style={{
          ...segmentStyle(!isBn),
          fontFamily: "var(--font-inter, Inter, ui-sans-serif, sans-serif)",
        }}
      >
        English
      </div>
    </div>
  );
};

export default LangToggleButton;
