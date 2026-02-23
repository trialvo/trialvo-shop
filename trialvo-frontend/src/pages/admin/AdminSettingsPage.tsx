import React, { useState } from 'react';
import { User, Lock, Loader2, Save, ShieldCheck, KeyRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const AdminSettingsPage: React.FC = () => {
 const { toast } = useToast();
 const { adminProfile } = useAuth();
 const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

 const [fullName, setFullName] = useState(adminProfile?.full_name || '');
 const [nameLoading, setNameLoading] = useState(false);

 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [passLoading, setPassLoading] = useState(false);

 const handleUpdateName = async () => {
  setNameLoading(true);
  try {
   await api.put('/auth/profile', { full_name: fullName });
   toast({ title: 'Profile updated successfully' });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
  setNameLoading(false);
 };

 const handleChangePassword = async () => {
  if (newPassword !== confirmPassword) {
   toast({ title: 'Passwords do not match', variant: 'destructive' });
   return;
  }
  if (newPassword.length < 6) {
   toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
   return;
  }

  setPassLoading(true);
  try {
   await api.put('/auth/password', { newPassword });
   toast({ title: 'Password changed successfully' });
   setNewPassword('');
   setConfirmPassword('');
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
  setPassLoading(false);
 };

 const inputClass = 'bg-background border-border text-foreground focus:border-primary focus:ring-primary/25';

 return (
  <div className="space-y-5 max-w-2xl animate-fade-in">
   <div className="admin-page-header">
    <h1>Settings</h1>
    <p>Manage your admin profile and security</p>
   </div>

   {/* Tab Switcher */}
   <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border w-fit">
    <button
     onClick={() => setActiveTab('profile')}
     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-card text-foreground shadow-soft-sm' : 'text-muted-foreground hover:text-foreground'}`}
    >
     <User className="w-4 h-4" />
     Profile
    </button>
    <button
     onClick={() => setActiveTab('security')}
     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-card text-foreground shadow-soft-sm' : 'text-muted-foreground hover:text-foreground'}`}
    >
     <KeyRound className="w-4 h-4" />
     Security
    </button>
   </div>

   {/* Profile Tab */}
   {activeTab === 'profile' && (
    <div className="admin-card">
     <div className="p-5 space-y-6">
      {/* Admin profile card */}
      <div className="flex items-center gap-4 pb-5 border-b border-border/50">
       <div className="relative">
        <div className="w-16 h-16 rounded-2xl hero-gradient shadow-soft-md flex items-center justify-center ring-4 ring-primary/10">
         <span className="text-2xl font-bold text-primary-foreground">
          {adminProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
         </span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
         <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
       </div>
       <div>
        <p className="text-lg font-bold text-foreground">{adminProfile?.full_name}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{adminProfile?.email}</p>
        <Badge variant="outline" className="mt-2 admin-badge admin-badge-active">
         <ShieldCheck className="w-3 h-3" />
         {adminProfile?.role?.replace('_', ' ')}
        </Badge>
       </div>
      </div>

      {/* Edit fields */}
      <div className="space-y-4">
       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">Full Name</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
       </div>

       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">Email</Label>
        <Input value={adminProfile?.email || ''} disabled className="bg-muted border-border text-muted-foreground opacity-70" />
       </div>

       <Button onClick={handleUpdateName} disabled={nameLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft-sm h-9 text-sm">
        {nameLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
        Save Changes
       </Button>
      </div>
     </div>
    </div>
   )}

   {/* Security Tab */}
   {activeTab === 'security' && (
    <div className="admin-card">
     <div className="p-5 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-border/50">
       <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
        <Lock className="w-5 h-5 text-amber-500" />
       </div>
       <div>
        <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Update your login credentials</p>
       </div>
      </div>

      <div className="space-y-4">
       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">New Password</Label>
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
       </div>

       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">Confirm New Password</Label>
        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
       </div>

       <Button onClick={handleChangePassword} disabled={passLoading || !newPassword || !confirmPassword} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft-sm h-9 text-sm">
        {passLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Lock className="w-4 h-4 mr-1.5" />}
        Change Password
       </Button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
};

export default AdminSettingsPage;
