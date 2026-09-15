"use client";

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { QueryError } from '@/components/admin/QueryError';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireSuperAdmin } from '@/hooks/admin/useRequireSuperAdmin';
import {
  useAdminStaff,
  useCreateStaff,
  useResetStaffPassword,
  useUpdateStaff,
} from '@/hooks/admin/useAdminStaff';
import {
  roleLabel,
  type AdminRole,
  type StaffMember,
} from '@/lib/adminStaffApi';

const inputClass =
  'bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/25';

const ROLES: AdminRole[] = ['super_admin', 'admin', 'editor'];

function roleBadgeClass(role: string): string {
  if (role === 'super_admin') return 'admin-badge admin-badge-active';
  if (role === 'admin') return 'admin-badge admin-badge-confirmed';
  return 'admin-badge admin-badge-pending';
}

interface CreateForm {
  email: string;
  full_name: string;
  role: AdminRole;
  phone: string;
  password: string;
}

const emptyCreate: CreateForm = {
  email: '',
  full_name: '',
  role: 'editor',
  phone: '',
  password: '',
};

interface EditForm {
  full_name: string;
  email: string;
  role: AdminRole;
  phone: string;
  is_active: boolean;
}

const AdminStaffPage: React.FC = () => {
  const { allowed, isLoading: gateLoading } = useRequireSuperAdmin();
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const { data: staff, isLoading, isError, error, refetch } = useAdminStaff();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const resetPassword = useResetStaffPassword();

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate);
  const [showCreatePass, setShowCreatePass] = useState(false);

  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    full_name: '',
    email: '',
    role: 'editor',
    phone: '',
    is_active: true,
  });

  const canManageMember = (member: StaffMember) =>
    member.role !== 'super_admin' || member.id === adminProfile?.id;

  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [resetPass, setResetPass] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);

  if (gateLoading || !allowed) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = staff?.filter((member) => {
    const q = search.toLowerCase();
    return (
      member.email.toLowerCase().includes(q) ||
      member.full_name.toLowerCase().includes(q) ||
      (member.phone || '').includes(search) ||
      member.role.replace('_', ' ').includes(q)
    );
  });

  const openCreate = () => {
    setCreateForm(emptyCreate);
    setShowCreatePass(false);
    setCreateOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    if (!canManageMember(member)) return;
    setEditing(member);
    setEditForm({
      full_name: member.full_name,
      email: member.email,
      role: member.role,
      phone: member.phone || '',
      is_active: member.is_active,
    });
  };

  const handleCreate = async () => {
    if (!createForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
      toast({ title: 'Valid email is required', variant: 'destructive' });
      return;
    }
    if (!createForm.full_name.trim()) {
      toast({ title: 'Full name is required', variant: 'destructive' });
      return;
    }
    if (createForm.password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    try {
      await createStaff.mutateAsync({
        email: createForm.email.trim(),
        full_name: createForm.full_name.trim(),
        role: createForm.role,
        phone: createForm.phone.trim() || undefined,
        password: createForm.password,
      });
      toast({ title: 'Staff member created' });
      setCreateOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create staff';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleEdit = async () => {
    if (!editing || !canManageMember(editing)) return;
    if (!editForm.full_name.trim()) {
      toast({ title: 'Full name is required', variant: 'destructive' });
      return;
    }
    if (!editForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
      toast({ title: 'Valid email is required', variant: 'destructive' });
      return;
    }
    try {
      await updateStaff.mutateAsync({
        id: editing.id,
        payload: {
          full_name: editForm.full_name.trim(),
          email: editForm.email.trim(),
          role: editForm.role,
          phone: editForm.phone.trim() || null,
          is_active: editForm.is_active,
        },
      });
      toast({ title: 'Staff member updated' });
      setEditing(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update staff';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleReset = async () => {
    if (!resetTarget || !canManageMember(resetTarget)) return;
    if (resetPass.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (resetPass !== resetConfirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    try {
      await resetPassword.mutateAsync({ id: resetTarget.id, password: resetPass });
      toast({ title: 'Password reset successfully' });
      setResetTarget(null);
      setResetPass('');
      setResetConfirm('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="admin-page-header">
          <h1>Staff</h1>
          <p>Create admin accounts and manage roles, phones, and access</p>
        </div>
        <Button
          onClick={openCreate}
          className="hero-gradient text-white hover:opacity-90 border-0 shadow-soft-sm h-9 text-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Staff
        </Button>
      </div>

      <div className="admin-search max-w-sm">
        <Search />
        <Input
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-card">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-5">
            <QueryError error={error} onRetry={() => refetch()} what="staff" />
          </div>
        ) : !filtered?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No staff members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="admin-table-header">
                  <th>Staff</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr key={member.id} className="admin-table-row">
                    <td>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </td>
                    <td>
                      <Badge variant="outline" className={roleBadgeClass(member.role)}>
                        {roleLabel(member.role)}
                      </Badge>
                    </td>
                    <td className="text-sm text-muted-foreground">{member.phone || '—'}</td>
                    <td>
                      <span
                        className={`admin-badge ${
                          member.is_active ? 'admin-badge-active' : 'admin-badge-inactive'
                        }`}
                      >
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {canManageMember(member) ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(member)}
                            aria-label={`Edit ${member.full_name}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setResetTarget(member);
                              setResetPass('');
                              setResetConfirm('');
                              setShowResetPass(false);
                            }}
                            aria-label={`Reset password for ${member.full_name}`}
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-right text-xs text-muted-foreground">Self only</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Email</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className={inputClass}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Full name</Label>
              <Input
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(value: AdminRole) => setCreateForm({ ...createForm, role: value })}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Phone (optional)</Label>
              <Input
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                className={inputClass}
                placeholder="Required for SMS alerts"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Temporary password</Label>
              <div className="relative">
                <Input
                  type={showCreatePass ? 'text' : 'password'}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className={`${inputClass} pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showCreatePass ? 'Hide password' : 'Show password'}
                  onClick={() => setShowCreatePass((v) => !v)}
                  className="absolute right-0.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {showCreatePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={createStaff.isPending}
              className="w-full hero-gradient text-white hover:opacity-90 border-0"
            >
              {createStaff.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-1.5" />
              )}
              Create staff
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Full name</Label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={inputClass}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value: AdminRole) => setEditForm({ ...editForm, role: value })}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Active</p>
                  <p className="text-xs text-muted-foreground">
                    {editing.id === adminProfile?.id
                      ? 'You cannot deactivate your own account'
                      : 'Inactive staff cannot sign in'}
                  </p>
                </div>
                <Switch
                  checked={editForm.is_active}
                  disabled={editing.id === adminProfile?.id}
                  onCheckedChange={(value) => setEditForm({ ...editForm, is_active: value })}
                />
              </div>
              <Button
                onClick={handleEdit}
                disabled={updateStaff.isPending}
                className="w-full hero-gradient text-white hover:opacity-90 border-0"
              >
                {updateStaff.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Pencil className="w-4 h-4 mr-1.5" />
                )}
                Save changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetTarget)} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          {resetTarget && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Set a temporary password for <span className="text-foreground font-medium">{resetTarget.full_name}</span>.
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">New password</Label>
                <div className="relative">
                  <Input
                    type={showResetPass ? 'text' : 'password'}
                    value={resetPass}
                    onChange={(e) => setResetPass(e.target.value)}
                    className={`${inputClass} pr-10`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showResetPass ? 'Hide password' : 'Show password'}
                    onClick={() => setShowResetPass((v) => !v)}
                    className="absolute right-0.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Confirm password</Label>
                <Input
                  type={showResetPass ? 'text' : 'password'}
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <Button
                onClick={handleReset}
                disabled={resetPassword.isPending}
                className="w-full hero-gradient text-white hover:opacity-90 border-0"
              >
                {resetPassword.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4 mr-1.5" />
                )}
                Reset password
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaffPage;
