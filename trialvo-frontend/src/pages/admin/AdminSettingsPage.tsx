import React, { useState, useEffect } from 'react';
import { User, Lock, Loader2, Save, ShieldCheck, KeyRound, Mail, Zap, CheckCircle, XCircle } from 'lucide-react';
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
 const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'email'>('profile');

 const [fullName, setFullName] = useState(adminProfile?.full_name || '');
 const [nameLoading, setNameLoading] = useState(false);

 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [passLoading, setPassLoading] = useState(false);

 // SMTP state
 const [smtp, setSmtp] = useState({
  smtp_host: '', smtp_port: '587', smtp_secure: 'false',
  smtp_user: '', smtp_pass: '', smtp_from: '',
  email_notifications_enabled: 'false',
 });
 const [smtpLoading, setSmtpLoading] = useState(false);
 const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
 const [testLoading, setTestLoading] = useState(false);

 useEffect(() => {
  if (activeTab === 'email') {
   api.get<any>('/admin/settings/smtp').then(setSmtp).catch(() => { });
  }
 }, [activeTab]);

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

 const handleSaveSmtp = async () => {
  setSmtpLoading(true);
  try {
   await api.put('/admin/settings/smtp', smtp);
   toast({ title: 'SMTP settings saved' });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
  setSmtpLoading(false);
 };

 const handleTestSmtp = async () => {
  setTestLoading(true);
  setTestResult(null);
  try {
   const res = await api.post<any>('/admin/settings/smtp/test', {
    host: smtp.smtp_host,
    port: smtp.smtp_port,
    secure: smtp.smtp_secure,
    user: smtp.smtp_user,
    pass: smtp.smtp_pass,
   });
   setTestResult({ success: true, message: res.message || 'Connection successful!' });
  } catch (err: any) {
   setTestResult({ success: false, message: err.message || 'Connection failed' });
  }
  setTestLoading(false);
 };

 const inputClass = 'bg-background border-border text-foreground focus:border-primary focus:ring-primary/25';

 return (
  <div className="space-y-5 max-w-2xl animate-fade-in">
   <div className="admin-page-header">
    <h1>Settings</h1>
    <p>Manage your admin profile, security, and email</p>
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
    <button
     onClick={() => setActiveTab('email')}
     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'email' ? 'bg-card text-foreground shadow-soft-sm' : 'text-muted-foreground hover:text-foreground'}`}
    >
     <Mail className="w-4 h-4" />
     Email
    </button>
   </div>

   {/* Profile Tab */}
   {activeTab === 'profile' && (
    <div className="admin-card">
     <div className="p-5 space-y-6">
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

   {/* Email Tab */}
   {activeTab === 'email' && (
    <div className="space-y-4">
     <div className="admin-card">
      <div className="p-5 space-y-5">
       <div className="flex items-center gap-3 pb-4 border-b border-border/50">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
         <Mail className="w-5 h-5 text-blue-500" />
        </div>
        <div>
         <h3 className="text-sm font-semibold text-foreground">SMTP Configuration</h3>
         <p className="text-xs text-muted-foreground mt-0.5">Configure email sending for notifications</p>
        </div>
       </div>

       {/* Enable/Disable toggle */}
       <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
        <div>
         <p className="text-sm font-medium text-foreground">Email Notifications</p>
         <p className="text-xs text-muted-foreground">Send emails on registration, orders, and status updates</p>
        </div>
        <button
         onClick={() => setSmtp(s => ({ ...s, email_notifications_enabled: s.email_notifications_enabled === 'true' ? 'false' : 'true' }))}
         className={`relative w-11 h-6 rounded-full transition-colors ${smtp.email_notifications_enabled === 'true' ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        >
         <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${smtp.email_notifications_enabled === 'true' ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
         <Label className="text-xs text-muted-foreground font-medium">SMTP Host</Label>
         <Input value={smtp.smtp_host} onChange={(e) => setSmtp(s => ({ ...s, smtp_host: e.target.value }))} placeholder="smtp.gmail.com" className={inputClass} />
        </div>
        <div className="space-y-1.5">
         <Label className="text-xs text-muted-foreground font-medium">Port</Label>
         <Input value={smtp.smtp_port} onChange={(e) => setSmtp(s => ({ ...s, smtp_port: e.target.value }))} placeholder="587" className={inputClass} />
        </div>
        <div className="space-y-1.5">
         <Label className="text-xs text-muted-foreground font-medium">Secure (TLS)</Label>
         <div className="flex rounded-lg border border-border overflow-hidden h-10">
          <button
           onClick={() => setSmtp(s => ({ ...s, smtp_secure: 'false' }))}
           className={`flex-1 text-xs font-medium ${smtp.smtp_secure === 'false' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}
          >No (STARTTLS)</button>
          <button
           onClick={() => setSmtp(s => ({ ...s, smtp_secure: 'true' }))}
           className={`flex-1 text-xs font-medium ${smtp.smtp_secure === 'true' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}
          >Yes (SSL)</button>
         </div>
        </div>
        <div className="space-y-1.5">
         <Label className="text-xs text-muted-foreground font-medium">Username / Email</Label>
         <Input value={smtp.smtp_user} onChange={(e) => setSmtp(s => ({ ...s, smtp_user: e.target.value }))} placeholder="your@email.com" className={inputClass} />
        </div>
        <div className="space-y-1.5">
         <Label className="text-xs text-muted-foreground font-medium">Password</Label>
         <Input type="password" value={smtp.smtp_pass} onChange={(e) => setSmtp(s => ({ ...s, smtp_pass: e.target.value }))} placeholder="••••••" className={inputClass} />
        </div>
        <div className="col-span-2 space-y-1.5">
         <Label className="text-xs text-muted-foreground font-medium">From Address</Label>
         <Input value={smtp.smtp_from} onChange={(e) => setSmtp(s => ({ ...s, smtp_from: e.target.value }))} placeholder="noreply@yourdomain.com" className={inputClass} />
        </div>
       </div>

       {/* Test Result */}
       {testResult && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${testResult.success ? 'bg-emerald-500/10 border-emerald-200 text-emerald-700' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
         {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
         <span className="text-sm">{testResult.message}</span>
        </div>
       )}

       <div className="flex gap-2 pt-2">
        <Button onClick={handleTestSmtp} disabled={testLoading || !smtp.smtp_host} variant="outline" className="border-border h-9 text-sm gap-1.5">
         {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
         Test Connection
        </Button>
        <Button onClick={handleSaveSmtp} disabled={smtpLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft-sm h-9 text-sm gap-1.5">
         {smtpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
         Save Settings
        </Button>
       </div>
      </div>
     </div>
    </div>
   )}
  </div>
 );
};

export default AdminSettingsPage;
