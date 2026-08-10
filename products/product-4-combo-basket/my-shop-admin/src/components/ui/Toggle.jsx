/**
 * Toggle — animated on/off switch.
 *
 * Usage:
 *   <Toggle checked={active} onChange={() => setActive(!active)} />
 *   <Toggle checked={featured} onChange={...} colorOn="bg-amber-400" size="sm" />
 */
export default function Toggle({
  checked,
  onChange,
  disabled = false,
  colorOn = "bg-[#e91e63]",
  size = "md", // 'sm' | 'md' | 'lg'
  label,
}) {
  const sizes = {
    sm: {
      track: "h-5 w-9",
      thumb: "h-3.5 w-3.5",
      on: "left-[calc(100%-18px)]",
      off: "left-0.5",
    },
    md: {
      track: "h-7 w-12",
      thumb: "h-5 w-5",
      on: "left-[calc(100%-22px)]",
      off: "left-1",
    },
    lg: {
      track: "h-8 w-14",
      thumb: "h-6 w-6",
      on: "left-[calc(100%-26px)]",
      off: "left-1",
    },
  };
  const s = sizes[size] || sizes.md;

  const btn = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex ${s.track} shrink-0 items-center rounded-full border transition-colors duration-300 disabled:opacity-40 ${
        checked
          ? `${colorOn} border-transparent`
          : "bg-slate-100 border-slate-200"
      }`}
    >
      <span
        className={`absolute inline-block ${s.thumb} rounded-full bg-white shadow-md transition-all duration-300 ${
          checked ? s.on : s.off
        }`}
      />
    </button>
  );

  if (label) {
    return (
      <label className="flex cursor-pointer items-center gap-2.5">
        {btn}
        <span className="text-sm text-slate-700 select-none">{label}</span>
      </label>
    );
  }

  return btn;
}
