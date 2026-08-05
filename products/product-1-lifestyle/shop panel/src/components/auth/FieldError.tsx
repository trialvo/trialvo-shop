import { AlertCircle } from "lucide-react";

interface FieldErrorProps {
  /** Validation message to display. When undefined the component renders nothing. */
  message?: string;
}

/**
 * Inline field-level error message rendered beneath a form control.
 * Returns null when `message` is falsy so callers need no conditional wrapping.
 */
export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" aria-live="polite" className="flex items-center gap-1.5 text-xs text-destructive mt-1">
      <AlertCircle size={11} className="shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
