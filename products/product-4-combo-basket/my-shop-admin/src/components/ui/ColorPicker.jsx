/**
 * ColorPicker — color picker input + hex input side by side.
 * Used in Sliders, WebsiteSettings, etc.
 *
 * Usage:
 *   <ColorPicker label="অ্যাকসেন্ট রঙ" value={form.accent_from} onChange={(v) => set('accent_from', v)} />
 */
import { FormField } from "./index";

export default function ColorPicker({
  label,
  value,
  onChange,
  hint,
  className = "",
}) {
  return (
    <FormField label={label} hint={hint} className={className}>
      <div className="flex gap-2">
        <input
          type="color"
          className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5 shrink-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className="input flex-1 font-mono text-xs"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
      </div>
    </FormField>
  );
}
