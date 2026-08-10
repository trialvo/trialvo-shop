/**
 * Avatar — gradient avatar from a name.
 *
 * Usage:
 *   <Avatar name="Rahim" size="md" />
 *   <Avatar name="আবু" size="lg" />
 */
const COLORS = [
  "from-[#e91e63] to-pink-400",
  "from-violet-500 to-purple-400",
  "from-blue-500 to-indigo-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-yellow-400",
];

const SIZE = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-14 w-14 text-lg",
};

export default function Avatar({ name = "?", size = "md", className = "" }) {
  const initial = (name || "?")[0].toUpperCase();
  const color = COLORS[(name || "").charCodeAt(0) % COLORS.length];
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${color} ${SIZE[size] || SIZE.md} ${className}`}
    >
      {initial}
    </div>
  );
}
