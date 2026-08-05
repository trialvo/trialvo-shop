import { cn } from "@/lib/utils";
import { PASSWORD_STRENGTH_LEVELS, type StrengthLevel } from "@/lib/theme";

interface PasswordStrengthBarProps {
  /** The raw password string to evaluate. */
  password: string;
}

function getStrength(password: string): StrengthLevel & { filled: number } {
  const len = password.length;
  let idx = 0;
  for (let i = PASSWORD_STRENGTH_LEVELS.length - 1; i >= 0; i--) {
    if (len >= PASSWORD_STRENGTH_LEVELS[i].threshold) { idx = i; break; }
  }
  const filled = len < PASSWORD_STRENGTH_LEVELS[0].threshold ? 0 : idx + 1;
  return { ...PASSWORD_STRENGTH_LEVELS[idx], filled };
}

/**
 * Three-segment strength meter shown below a new-password input.
 * Renders nothing when `password` is empty.
 */
export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  if (!password) return null;

  const { label, filled } = getStrength(password);

  return (
    <div className="space-y-1.5" aria-live="polite" aria-label={`Password strength: ${label}`}>
      <div className="flex gap-1" role="meter" aria-valuenow={filled} aria-valuemin={0} aria-valuemax={3}>
        {PASSWORD_STRENGTH_LEVELS.map(({ threshold, color }, i) => (
          <div
            key={threshold}
            className={cn(
              "flex-1 h-0.5 rounded-full transition-all duration-500",
              i < filled ? color : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground tracking-wide">
        {password.length < PASSWORD_STRENGTH_LEVELS[0].threshold
          ? "Too short — minimum 8 characters"
          : `${label} password`}
      </p>
    </div>
  );
}
