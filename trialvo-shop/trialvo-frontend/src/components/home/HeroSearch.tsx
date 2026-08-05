import type { FormEvent } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HeroSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  className?: string;
};

/**
 * Marketplace hero search — always light surface so typed text stays visible
 * (avoids dark-mode foreground inheriting onto a white field).
 */
export function HeroSearch({
  value,
  onChange,
  onSubmit,
  className,
}: Readonly<HeroSearchProps>) {
  const { language } = useLanguage();

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={cn(
        "flex w-full max-w-xl items-center gap-2 rounded-lg bg-white p-1.5 shadow-lg shadow-black/20",
        "ring-1 ring-black/5",
        className,
      )}
      style={{ colorScheme: "light" }}
    >
      <label className="sr-only" htmlFor="marketplace-search">
        {language === "bn" ? "প্রোডাক্ট খুঁজুন" : "Search products"}
      </label>
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
        <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <input
          id="marketplace-search"
          type="search"
          name="q"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            language === "bn" ? "ফ্যাশন, গিফট, টেক…" : "Fashion, gift, tech…"
          }
          className={cn(
            "h-10 w-full min-w-0 bg-transparent text-sm outline-none",
            "text-zinc-900 caret-zinc-900",
            "placeholder:text-zinc-400",
            "[&::-webkit-search-cancel-button]:appearance-none",
            // Keep autofill readable on white surface
            "[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#fff]",
            "[&:-webkit-autofill]:[-webkit-text-fill-color:#18181b]",
          )}
        />
      </div>
      <Button
        type="submit"
        className="h-10 shrink-0 rounded-md bg-accent px-5 font-semibold text-accent-foreground hover:bg-accent/90"
      >
        {language === "bn" ? "খুঁজুন" : "Search"}
      </Button>
    </form>
  );
}

export default HeroSearch;
