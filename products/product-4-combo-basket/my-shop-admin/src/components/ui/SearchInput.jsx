import { Search, X } from "lucide-react";

/**
 * SearchInput — search bar with clear button.
 *
 * Usage:
 *   <SearchInput value={search} onChange={setSearch} placeholder="খুঁজুন..." />
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "খুঁজুন...",
  className = "",
  onClear,
}) {
  const handleClear = () => {
    onChange("");
    onClear?.();
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        className="input pl-10 pr-8"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
