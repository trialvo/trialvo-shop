import React, { useState } from 'react';
import { Copy, KeyRound, ExternalLink, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export type InstanceCredentials = {
  adminEmail?: string | null;
  adminPassword?: string | null;
};

type CredentialsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  credentials: InstanceCredentials | null;
  shopUrl?: string | null;
  adminUrl?: string | null;
  customerLabel?: string | null;
  sharedDemo?: boolean;
};

/**
 * Admin credentials popup — same interaction pattern as the public trial status page.
 */
export function CredentialsDialog({
  open,
  onOpenChange,
  loading,
  credentials,
  shopUrl,
  adminUrl,
  customerLabel,
  sharedDemo,
}: CredentialsDialogProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: 'Copied', description: label });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setShowPassword(false);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Login credentials
          </DialogTitle>
          <DialogDescription>
            {customerLabel || 'Trial instance admin login'}
            {sharedDemo ? ' · Shared demo' : ''}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : credentials ? (
          <div className="space-y-4">
            {(shopUrl || adminUrl) && (
              <div className="flex flex-wrap gap-2">
                {shopUrl && (
                  <Button asChild size="sm" variant="outline">
                    <a href={shopUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Open shop
                    </a>
                  </Button>
                )}
                {adminUrl && (
                  <Button asChild size="sm">
                    <a href={adminUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Open admin
                    </a>
                  </Button>
                )}
              </div>
            )}

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              {credentials.adminEmail && (
                <CredentialRow
                  label="Admin email"
                  value={credentials.adminEmail}
                  onCopy={() => copy(credentials.adminEmail!, 'Email')}
                />
              )}
              {credentials.adminPassword && (
                <CredentialRow
                  label="Admin password"
                  value={credentials.adminPassword}
                  secret={!showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  onCopy={() => copy(credentials.adminPassword!, 'Password')}
                />
              )}
              {!credentials.adminEmail && !credentials.adminPassword && (
                <p className="text-sm text-muted-foreground">No credentials stored for this instance.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">Could not load credentials.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CredentialRow({
  label, value, secret, onCopy, onToggle,
}: {
  label: string;
  value: string;
  secret?: boolean;
  onCopy: () => void;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background border">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
        <p className="text-sm truncate font-mono">{secret ? '••••••••' : value}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        {onToggle && (
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onToggle}>
            {secret ? 'Show' : 'Hide'}
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCopy} aria-label={`Copy ${label}`}>
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
