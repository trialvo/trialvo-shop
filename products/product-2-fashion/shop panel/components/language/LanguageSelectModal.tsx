"use client";

import { useLanguage, type Language } from "@/providers/LanguageProvider";
import React from "react";

const SELECTED_KEY = "language_selected";

const LanguageSelectModal: React.FC = () => {
 const { setLanguage } = useLanguage();
 const [visible, setVisible] = React.useState(false);
 const [mounted, setMounted] = React.useState(false);
 const [selected, setSelected] = React.useState<Language | null>(null);
 const [hovering, setHovering] = React.useState<Language | null>(null);

 React.useEffect(() => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(SELECTED_KEY)) {
   setVisible(true);
   requestAnimationFrame(() => setMounted(true));
  }
 }, []);

 if (!visible) return null;

 const handleSelect = (lang: Language) => {
  if (selected) return;
  setSelected(lang);
  setLanguage(lang);
  localStorage.setItem(SELECTED_KEY, "1");
  setTimeout(() => setVisible(false), 500);
 };

 return (
  <div
   style={{
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    backgroundColor: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    transition: "opacity 0.4s ease",
    opacity: mounted ? 1 : 0,
    fontFamily: "inherit",
   }}
   aria-hidden="true"
  >
   {/* Modal panel */}
   <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="lang-title"
    style={{
     width: "100%",
     maxWidth: 440,
     background: "#fff",
     transform: mounted ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
     transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease",
     opacity: mounted ? 1 : 0,
     overflow: "hidden",
     position: "relative",
    }}
   >
    {/* Top accent line with gradient */}
    <div style={{
     height: 3,
     background: "linear-gradient(90deg, #000 0%, #555 50%, #000 100%)",
    }} />

    {/* Header section */}
    <div style={{
     padding: "36px 40px 28px",
     borderBottom: "1px solid #f0f0f0",
    }}>
     {/* Decorative thin lines */}
     <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
      <span style={{
       fontSize: 9,
       fontWeight: 600,
       letterSpacing: "0.22em",
       color: "#999",
       textTransform: "uppercase",
      }}>
       GRADUATE
      </span>
      <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
     </div>

     <h2
      id="lang-title"
      style={{
       margin: 0,
       fontSize: 22,
       fontWeight: 700,
       letterSpacing: "-0.01em",
       color: "#0a0a0a",
       lineHeight: 1.2,
      }}
     >
      Choose Your Language
     </h2>
     <p style={{
      margin: "6px 0 0",
      fontSize: 13,
      color: "#888",
      letterSpacing: "0.01em",
      lineHeight: 1.5,
     }}>
      আপনার পছন্দের ভাষা নির্বাচন করুন। পরে settings থেকে পরিবর্তন করা যাবে।
     </p>
    </div>

    {/* Language options */}
    <div style={{ padding: "20px 40px 36px", display: "flex", flexDirection: "column", gap: 12 }}>
     {(
      [
       {
        lang: "bn" as Language,
        label: "বাংলা",
        sub: "Bengali · Default",
        isDefault: true,
       },
       {
        lang: "en" as Language,
        label: "English",
        sub: "English · International",
        isDefault: false,
       },
      ] as const
     ).map(({ lang, label, sub, isDefault }) => {
      const isSelected = selected === lang;
      const isHovered = hovering === lang && !selected;
      const active = isSelected || isHovered;

      return (
       <button
        key={lang}
        type="button"
        onClick={() => handleSelect(lang)}
        onMouseEnter={() => setHovering(lang)}
        onMouseLeave={() => setHovering(null)}
        disabled={!!selected}
        style={{
         display: "flex",
         alignItems: "center",
         justifyContent: "space-between",
         gap: 16,
         padding: "18px 22px",
         background: active ? "#0a0a0a" : "#fafafa",
         border: `1.5px solid ${active ? "#0a0a0a" : "#e8e8e8"}`,
         cursor: selected ? "not-allowed" : "pointer",
         textAlign: "left",
         transition: "background 0.2s ease, border-color 0.2s ease",
         width: "100%",
         position: "relative",
         overflow: "hidden",
        }}
       >
        {/* Left: text */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
         {/* Accent bar */}
         <div style={{
          width: 3,
          height: 38,
          background: active ? "#fff" : "#0a0a0a",
          flexShrink: 0,
          transition: "background 0.2s ease",
         }} />

         <div>
          <div style={{
           display: "flex",
           alignItems: "center",
           gap: 8,
          }}>
           <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: active ? "#fff" : "#0a0a0a",
            letterSpacing: "0.01em",
            transition: "color 0.2s ease",
           }}>
            {label}
           </span>
           {isDefault && (
            <span style={{
             fontSize: 9,
             fontWeight: 700,
             letterSpacing: "0.14em",
             textTransform: "uppercase",
             color: active ? "rgba(255,255,255,0.55)" : "#888",
             border: `1px solid ${active ? "rgba(255,255,255,0.25)" : "#d4d4d4"}`,
             padding: "2px 6px",
             transition: "color 0.2s ease, border-color 0.2s ease",
            }}>
             Default
            </span>
           )}
          </div>
          <div style={{
           fontSize: 11,
           color: active ? "rgba(255,255,255,0.45)" : "#aaa",
           marginTop: 2,
           letterSpacing: "0.03em",
           transition: "color 0.2s ease",
          }}>
           {sub}
          </div>
         </div>
        </div>

        {/* Right: arrow / checkmark */}
        <div style={{ flexShrink: 0, width: 20, height: 20, position: "relative" }}>
         {isSelected ? (
          /* Checkmark */
          <svg viewBox="0 0 20 20" fill="none" style={{ width: 20, height: 20 }}>
           <circle cx="10" cy="10" r="9" stroke="white" strokeWidth="1.5" />
           <path d="M6 10.2 L8.8 13 L14 7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
         ) : (
          /* Arrow */
          <svg viewBox="0 0 20 20" fill="none" style={{ width: 20, height: 20, opacity: active ? 1 : 0.3, transition: "opacity 0.2s" }}>
           <path d="M7 10 L13 10 M10.5 7 L13.5 10 L10.5 13" stroke={active ? "white" : "#0a0a0a"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }} />
          </svg>
         )}
        </div>
       </button>
      );
     })}
    </div>

    {/* Footer */}
    <div style={{
     padding: "0 40px 24px",
     display: "flex",
     alignItems: "center",
     gap: 10,
    }}>
     <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
     <span style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase" }}>
      Graduate Fashion · 2025
     </span>
     <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
    </div>
   </div>
  </div>
 );
};

export default LanguageSelectModal;
