import { Truck, ShieldCheck, Lock } from "lucide-react";

const badges = [
  {
    icon: Truck,
    title: "দ্রুত ডেলিভারি",
    subtitle: "দ্রুত ও নিরাপদ",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
  },
  {
    icon: ShieldCheck,
    title: "অরিজিনাল প্রোডাক্ট",
    subtitle: "১০০% অরিজিনাল",
    color: "text-blue-600",
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
  },
  {
    icon: Lock,
    title: "নিরাপদ পেমেন্ট",
    subtitle: "SSL সুরক্ষিত",
    color: "text-purple-600",
    bg: "bg-purple-50",
    iconBg: "bg-purple-100",
  },
];

export default function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {badges.map((badge, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-3 rounded-xl ${badge.bg} px-4 py-3 transition-all duration-200 hover:shadow-sm`}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${badge.iconBg}`}
          >
            <badge.icon className={`h-4 w-4 ${badge.color}`} />
          </div>
          <div>
            <p className={`text-xs font-semibold ${badge.color}`}>
              {badge.title}
            </p>
            <p className="text-[10px] text-slate-500">{badge.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
