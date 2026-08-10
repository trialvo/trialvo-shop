import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const ACCENT_MAP = {
  "bg-[#e91e63]": {
    card: "stat-card-pink",
    icon: "#e91e63",
    iconBg: "rgba(233,30,99,0.1)",
  },
  "bg-blue-500": {
    card: "stat-card-blue",
    icon: "#3b82f6",
    iconBg: "rgba(59,130,246,0.1)",
  },
  "bg-emerald-500": {
    card: "stat-card-green",
    icon: "#10b981",
    iconBg: "rgba(16,185,129,0.1)",
  },
  "bg-violet-500": {
    card: "stat-card-purple",
    icon: "#8b5cf6",
    iconBg: "rgba(139,92,246,0.1)",
  },
  "bg-amber-500": {
    card: "stat-card-amber",
    icon: "#f59e0b",
    iconBg: "rgba(245,158,11,0.1)",
  },
};

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg = "bg-slate-700",
  trend,
  className = "",
}) {
  const isUp = trend >= 0;
  const accent = ACCENT_MAP[iconBg] || {
    card: "",
    icon: "#64748b",
    iconBg: "rgba(100,116,139,0.1)",
  };

  return (
    <div
      className={`card card-hover flex flex-col gap-4 relative overflow-hidden ${accent.card} ${className}`}
    >
      {/* Decorative circle */}
      <div
        className="absolute -top-4 -right-4 h-20 w-20 rounded-full opacity-8"
        style={{ background: accent.icon, filter: "blur(20px)" }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: accent.iconBg }}
        >
          {Icon && <Icon className="h-5 w-5" style={{ color: accent.icon }} />}
        </div>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold rounded-lg px-2 py-1 ${isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
          >
            {isUp ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          {label}
        </p>
        <p className="mt-1.5 text-2xl font-extrabold text-[#0f172a] leading-none">
          {value ?? "—"}
        </p>
        {sub && <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}
