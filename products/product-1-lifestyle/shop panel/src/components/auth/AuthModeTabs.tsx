import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AuthMode = "login" | "signup";

interface AuthModeTabsProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  disabled?: boolean;
}

const modes: Array<{ value: AuthMode; label: string }> = [
  { value: "login", label: "Sign In" },
  { value: "signup", label: "Create Account" },
];

export function AuthModeTabs({
  mode,
  onModeChange,
  disabled = false,
}: AuthModeTabsProps) {
  return (
    <div className="relative flex mb-8 border-b border-border">
      {modes.map((item) => {
        const active = item.value === mode;

        return (
          <Button
            key={item.value}
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={() => onModeChange(item.value)}
            className={cn(
              "relative z-10 h-auto flex-1 cursor-pointer rounded-none bg-transparent px-0 pb-3 pt-0",
              "text-xs font-medium uppercase tracking-[0.2em]",
              "transition-all duration-300 hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60",
              active ? "text-foreground" : "text-muted-foreground",
            )}
            aria-pressed={active}
          >
            {item.label}
          </Button>
        );
      })}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 h-0.5 w-1/2 bg-accent transition-transform duration-300 ease-out",
          mode === "signup" ? "translate-x-full" : "translate-x-0",
        )}
      />
    </div>
  );
}
