import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  /** Renders the confirm button in destructive styling. */
  destructive?: boolean;
  /** When set, the user must type this exact word before confirm is enabled (§12.3). */
  typedConfirmWord?: string;
  busy?: boolean;
}

/**
 * Reusable confirmation dialog. For irreversible actions pass `typedConfirmWord`
 * to require the operator to type an exact phrase (e.g. "DESTROY") before the
 * confirm button becomes active — an in-app, accessible replacement for
 * window.confirm/prompt.
 */
export function ConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, destructive, typedConfirmWord, busy,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');

  // Reset the typed value whenever the dialog opens/closes.
  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const canConfirm = !busy && (!typedConfirmWord || typed.trim().toUpperCase() === typedConfirmWord.toUpperCase());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive && <AlertTriangle className="w-4 h-4 text-destructive" />}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {typedConfirmWord && (
          <div className="space-y-1.5 py-1">
            <Label htmlFor="confirm-typed" className="text-xs">
              Type <span className="font-mono font-semibold">{typedConfirmWord}</span> to confirm
            </Label>
            <Input
              id="confirm-typed"
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={typedConfirmWord}
              autoComplete="off"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={() => onConfirm()}
            disabled={!canConfirm}
          >
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
