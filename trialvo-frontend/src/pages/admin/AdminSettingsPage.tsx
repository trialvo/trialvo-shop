import React, { useState } from 'react';
import { User, Lock, Loader2, Save, ShieldCheck, KeyRound, CreditCard, Activity, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
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
 const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'payment'>('profile');

 const [fullName, setFullName] = useState(adminProfile?.full_name || '');
 const [nameLoading, setNameLoading] = useState(false);

 const [currentPassword, setCurrentPassword] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [passLoading, setPassLoading] = useState(false);

 // Trialvo Pay Settings
 const [trialvoPay, setTrialvoPay] = useState({
  serviceId: '',
  apiKey: '',
  ipnSecret: '',
  baseUrl: 'http://trialvo-pay:8080'
 });
 const [settingsLoading, setSettingsLoading] = useState(false);
 const [testLoading, setTestLoading] = useState(false);
 const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

 // Fetch settings on mount
 React.useEffect(() => {
  const fetchSettings = async () => {
   try {
    const data = await api.get<any>('/admin/settings/trialvo-pay');
    setTrialvoPay({
     serviceId: data.trialvo_pay_service_id || '',
     apiKey: data.trialvo_pay_api_key || '',
     ipnSecret: data.trialvo_pay_ipn_secret || '',
     baseUrl: data.trialvo_pay_base_url || 'http://trialvo-pay:8080'
    });
   } catch (err) {
    console.error('Failed to fetch Trialvo Pay settings', err);
   }
  };
  fetchSettings();
 }, []);

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
  if (!currentPassword) {
   toast({ title: 'Current password is required', variant: 'destructive' });
   return;
  }
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
   await api.put('/auth/password', { currentPassword, newPassword });
   toast({ title: 'Password changed successfully' });
   setCurrentPassword('');
   setNewPassword('');
   setConfirmPassword('');
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
  setPassLoading(false);
 };

 const handleUpdateTrialvoPay = async () => {
  setSettingsLoading(true);
  try {
   await api.post('/admin/settings/trialvo-pay', trialvoPay);
   toast({ title: 'Trialvo Pay settings updated' });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
  setSettingsLoading(false);
 };

 const handleTestConnection = async () => {
  setTestLoading(true);
  setTestResult(null);
  try {
   const res = await api.post<any>('/admin/settings/trialvo-pay/test', trialvoPay);
   setTestResult({ success: true, message: res.message || 'Connection successful!' });
   toast({ title: 'Connection Successful', description: 'Trialvo Pay is reachable with these credentials.' });
  } catch (err: any) {
   setTestResult({ success: false, message: err.message || 'Connection failed' });
   toast({ title: 'Connection Failed', description: err.message, variant: 'destructive' });
  }
  setTestLoading(false);
 };

 const inputClass = 'bg-background border-border text-foreground focus:border-primary focus:ring-primary/25';

 return (
  <div className="space-y-5 max-w-2xl animate-fade-in">
   <div className="admin-page-header">
    <h1>Settings</h1>
    <p>Manage your store configuration and profile</p>
   </div>

   {/* Tab Switcher */}
   <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border w-fit overflow-x-auto">
    <button
     onClick={() => setActiveTab('profile')}
     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-card text-foreground shadow-soft-sm' : 'text-muted-foreground hover:text-foreground'}`}
    >
     <User className="w-4 h-4" />
     Profile
    </button>
    <button
     onClick={() => setActiveTab('security')}
     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'security' ? 'bg-card text-foreground shadow-soft-sm' : 'text-muted-foreground hover:text-foreground'}`}
    >
     <KeyRound className="w-4 h-4" />
     Security
    </button>
    <button
     onClick={() => setActiveTab('payment')}
     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'payment' ? 'bg-card text-foreground shadow-soft-sm' : 'text-muted-foreground hover:text-foreground'}`}
    >
     <CreditCard className="w-4 h-4" />
     Trialvo Pay
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
        <Label className="text-xs text-muted-foreground font-medium">Current Password</Label>
        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
       </div>

       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">New Password</Label>
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
       </div>

       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">Confirm New Password</Label>
        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
       </div>

       <Button onClick={handleChangePassword} disabled={passLoading || !currentPassword || !newPassword || !confirmPassword} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft-sm h-9 text-sm">
        {passLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Lock className="w-4 h-4 mr-1.5" />}
        Change Password
       </Button>
      </div>
     </div>
    </div>
   )}

   {/* Trialvo Pay Tab */}
   {activeTab === 'payment' && (
    <div className="admin-card overflow-hidden">
     <div className="hero-gradient-soft p-6 border-b border-border/50">
      <div className="flex items-center gap-4">
       <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-soft-sm ring-1 ring-primary/20">
        <CreditCard className="w-6 h-6 text-primary" />
       </div>
       <div>
        <h3 className="text-lg font-bold text-foreground">Trialvo Pay</h3>
        <p className="text-sm text-muted-foreground">Configure your payment gateway credentials</p>
       </div>
      </div>
     </div>
     
     <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">Service ID</Label>
        <Input 
         value={trialvoPay.serviceId} 
         onChange={(e) => setTrialvoPay({...trialvoPay, serviceId: e.target.value})} 
         className={inputClass}
         placeholder="e.g. 28280023-..."
        />
       </div>
       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">API Key</Label>
        <Input 
         type="password"
         value={trialvoPay.apiKey} 
         onChange={(e) => setTrialvoPay({...trialvoPay, apiKey: e.target.value})} 
         className={inputClass}
         placeholder="Secret API Key"
        />
       </div>
       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">Webhook (IPN) Secret</Label>
        <Input 
         type="password"
         value={trialvoPay.ipnSecret} 
         onChange={(e) => setTrialvoPay({...trialvoPay, ipnSecret: e.target.value})} 
         className={inputClass}
         placeholder="Used to verify incoming payments"
        />
       </div>
      </div>

      <div className="space-y-1.5">
       <Label className="text-xs text-muted-foreground font-medium">Base URL</Label>
       <Input 
        value={trialvoPay.baseUrl} 
        onChange={(e) => setTrialvoPay({...trialvoPay, baseUrl: e.target.value})} 
        className={inputClass}
        placeholder="http://trialvo-pay:8080"
       />
       <p className="text-[10px] text-muted-foreground">Internal Docker URL or public domain of Trialvo Pay service</p>
      </div>

      {testResult && (
       <div className={`p-3 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
        {testResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
        <div>
         <p className="text-sm font-bold">{testResult.success ? 'Connected' : 'Failed'}</p>
         <p className="text-xs opacity-80">{testResult.message}</p>
        </div>
       </div>
      )}

      <div className="flex items-center gap-3 pt-2">
       <Button onClick={handleUpdateTrialvoPay} disabled={settingsLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft-sm">
        {settingsLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
        Save Settings
       </Button>
       <Button variant="outline" onClick={handleTestConnection} disabled={testLoading} className="border-primary/20 text-primary hover:bg-primary/5">
        {testLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Activity className="w-4 h-4 mr-1.5" />}
        Test Connection
       </Button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
};

export default AdminSettingsPage;
