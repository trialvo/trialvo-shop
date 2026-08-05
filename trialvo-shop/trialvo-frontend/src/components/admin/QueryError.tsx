import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueryErrorProps {
  /** The error thrown by the query (message is surfaced when available). */
  error?: unknown;
  /** Optional retry handler (e.g. query.refetch). */
  onRetry?: () => void;
  /** Short context, e.g. "trial instances". */
  what?: string;
  className?: string;
}

function messageOf(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  const anyErr = error as { message?: string };
  return anyErr?.message || null;
}

/**
 * Consistent inline error state for admin data queries. Surfaces a readable
 * message plus an optional retry action instead of silently rendering blank
 * or default/empty data when a fetch fails.
 */
export function QueryError({ error, onRetry, what, className }: QueryErrorProps) {
  const msg = messageOf(error);
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center ${className || ''}`.trim()}
    >
      <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-foreground">
          {what ? `Couldn't load ${what}` : 'Something went wrong'}
        </p>
        {msg && <p className="mt-1 text-xs text-muted-foreground break-words">{msg}</p>}
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}

export default QueryError;
