"use client";

import React, { useState, useEffect } from 'react';
import { useQueryString } from '@/hooks/useQueryString';
import { User, Lock, Loader2, Save, ShieldCheck, CreditCard, Activity, CheckCircle2, AlertCircle, Eye, EyeOff, FlaskConical, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AdminNumberInput } from '@/components/admin/AdminNumberInput';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Switch } from '@/components/ui/switch';
import { TrialSettingsPanel } from '@/components/admin/trial/TrialSettingsPanel';

const AdminSettingsPage: React.FC = () => {
 const { toast } = useToast();
 const { adminProfile, applyAdminProfile } = useAuth();
 const { searchParams, setSearchParams } = useQueryString();
 const rawTab = searchParams.get('tab');
 // Profile + Security merged; keep old ?tab=security links working
 const activeTab = (
  !rawTab || rawTab === 'security'
   ? 'profile'
   : (rawTab as 'profile' | 'payment' | 'trial' | 'email')
 );

 const setActiveTab = (tab: string) => {
  setSearchParams({ tab });
 };

 const [fullName, setFullName] = useState(adminProfile?.full_name || '');
 const [email, setEmail] = useState(adminProfile?.email || '');
 const [nameLoading, setNameLoading] = useState(false);

 const [currentPassword, setCurrentPassword] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [passLoading, setPassLoading] = useState(false);

 // Visibility States
 const [showCurrentPass, setShowCurrentPass] = useState(false);
 const [showNewPass, setShowNewPass] = useState(false);
 const [showConfirmPass, setShowConfirmPass] = useState(false);
 const [showApiKey, setShowApiKey] = useState(false);
 const [showIpnSecret, setShowIpnSecret] = useState(false);
 const [showSmtpPass, setShowSmtpPass] = useState(false);

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

 // SMTP settings
 const [smtpForm, setSmtpForm] = useState({
  enabled: false,
  host: '',
  port: 587,
  secure: false,
  user: '',
  password: '',
  hasPassword: false,
  fromEmail: 'noreply@trialvo.com',
  fromName: 'Trialvo Shop',
  testEmail: '',
 });
 const [smtpSaving, setSmtpSaving] = useState(false);
 const [smtpTestLoading, setSmtpTestLoading] = useState(false);
 const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

 useEffect(() => {
  const fetchSettings = async () => {
   try {
    const [payData, smtpData] = await Promise.all([
     api.get<any>('/admin/settings/trialvo-pay'),
     api.get<any>('/admin/settings/smtp'),
    ]);
    setTrialvoPay({
     serviceId: payData.trialvo_pay_service_id || '',
     apiKey: payData.trialvo_pay_api_key || '',
     ipnSecret: payData.trialvo_pay_ipn_secret || '',
     baseUrl: payData.trialvo_pay_base_url || 'http://trialvo-pay:8080'
    });
    setSmtpForm((prev) => ({
     ...prev,
     enabled: smtpData.enabled ?? false,
     host: smtpData.host || '',
     port: smtpData.port || 587,
     secure: smtpData.secure ?? false,
     user: smtpData.user || '',
     password: '',
     hasPassword: smtpData.hasPassword ?? false,
     fromEmail: smtpData.fromEmail || 'noreply@trialvo.com',
     fromName: smtpData.fromName || 'Trialvo Shop',
     testEmail: adminProfile?.email || '',
    }));
   } catch (err) {
    console.error('Failed to fetch settings', err);
   }
  };
  fetchSettings();
 }, [adminProfile?.email]);

 useEffect(() => {
  if (adminProfile) {
   setFullName(adminProfile.full_name || '');
   setEmail(adminProfile.email || '');
  }
 }, [adminProfile?.id, adminProfile?.full_name, adminProfile?.email]);

 const handleUpdateProfile = async () => {
  if (!fullName.trim()) {
   toast({ title: 'Full name is required', variant: 'destructive' });
   return;
  }
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
   toast({ title: 'Valid email is required', variant: 'destructive' });
   return;
  }
  setNameLoading(true);
  try {
   const res = await api.put<{ message: string; admin: any }>('/auth/profile', {
    full_name: fullName.trim(),
    email: email.trim(),
   });
   if (res.admin) applyAdminProfile(res.admin);
   toast({ title: 'Profile updated successfully' });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
  setNameLoading(false);
 };

 const handleSaveSmtpSettings = async () => {
  setSmtpSaving(true);
  try {
   const payload: Record<string, unknown> = {
    enabled: smtpForm.enabled,
    host: smtpForm.host,
    port: smtpForm.port,
    secure: smtpForm.secure,
    user: smtpForm.user,
    fromEmail: smtpForm.fromEmail,
    fromName: smtpForm.fromName,
   };
   if (smtpForm.password) payload.password = smtpForm.password;

   const res = await api.post<any>('/admin/settings/smtp', payload);
   setSmtpForm((prev) => ({
    ...prev,
    password: '',
    hasPassword: res.hasPassword ?? prev.hasPassword,
   }));
   toast({ title: 'SMTP settings saved' });
  } catch (err: any) {
   toast({ title: 'Error', description: err.message, variant: 'destructive' });
  }
  setSmtpSaving(false);
 };

 const handleTestSmtp = async () => {
  setSmtpTestLoading(true);
  setSmtpTestResult(null);
  try {
   const payload: Record<string, unknown> = {
    testEmail: smtpForm.testEmail || adminProfile?.email,
    host: smtpForm.host,
    port: smtpForm.port,
    secure: smtpForm.secure,
    user: smtpForm.user,
    fromEmail: smtpForm.fromEmail,
    fromName: smtpForm.fromName,
   };
   if (smtpForm.password) payload.password = smtpForm.password;

   const res = await api.post<any>('/admin/settings/smtp/test', payload);
   setSmtpTestResult({ success: true, message: res.message || 'Test email sent' });
   toast({ title: 'Test email sent', description: res.message });
  } catch (err: any) {
   const msg = err.message || 'SMTP test failed';
   setSmtpTestResult({ success: false, message: msg });
   toast({ title: 'SMTP test failed', description: msg, variant: 'destructive' });
  }
  setSmtpTestLoading(false);
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
     onClick={() => setActiveTab('trial')}
     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'trial' ? 'bg-card text-foreground shadow-soft-sm' : 'text-muted-foreground hover:text-foreground'}`}
    >
     <FlaskConical className="w-4 h-4" />
     Trials
    </button>
    <button
     onClick={() => setActiveTab('email')}
     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'email' ? 'bg-card text-foreground shadow-soft-sm' : 'text-muted-foreground hover:text-foreground'}`}
    >
     <Mail className="w-4 h-4" />
     Email
    </button>
    <button
     onClick={() => setActiveTab('payment')}
     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'payment' ? 'bg-card text-foreground shadow-soft-sm' : 'text-muted-foreground hover:text-foreground'}`}
    >
     <CreditCard className="w-4 h-4" />
     Trialvo Pay
    </button>
   </div>

   {/* Profile + Security (merged) */}
   {activeTab === 'profile' && (
    <div className="space-y-5">
     <div className="admin-card">
      <div className="p-5 space-y-6">
       <div className="flex items-center gap-4 pb-5 border-b border-border/50">
        <div className="relative">
         <div className="w-16 h-16 rounded-2xl hero-gradient shadow-soft-md flex items-center justify-center ring-4 ring-primary/10">
          <span className="text-2xl font-bold text-white">
           {(fullName || adminProfile?.full_name || 'A').charAt(0).toUpperCase()}
          </span>
         </div>
         <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
         </div>
        </div>
        <div>
         <p className="text-lg font-bold text-foreground">{fullName || adminProfile?.full_name}</p>
         <p className="text-sm text-muted-foreground mt-0.5">{email || adminProfile?.email}</p>
         <Badge variant="outline" className="mt-2 admin-badge admin-badge-active">
          <ShieldCheck className="w-3 h-3" />
          {adminProfile?.role?.replace('_', ' ')}
         </Badge>
        </div>
       </div>

       <div className="space-y-4">
        <div className="space-y-1.5">
         <Label className="text-xs text-muted-foreground font-medium">Full Name</Label>
         <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          autoComplete="name"
         />
        </div>

        <div className="space-y-1.5">
         <Label className="text-xs text-muted-foreground font-medium">Email</Label>
         <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          autoComplete="email"
         />
         <p className="text-[10px] text-muted-foreground">Used for admin login. Must be unique.</p>
        </div>

        <Button
         onClick={handleUpdateProfile}
         disabled={nameLoading}
         className="hero-gradient text-white hover:opacity-90 border-0 shadow-soft-sm h-9 text-sm"
        >
         {nameLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
         Save Changes
        </Button>
       </div>
      </div>
     </div>

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
         <div className="relative">
          <Input
           type={showCurrentPass ? 'text' : 'password'}
           value={currentPassword}
           onChange={(e) => setCurrentPassword(e.target.value)}
           className={`${inputClass} pr-10`}
           placeholder="Enter current password"
           autoComplete="current-password"
          />
          <button
           type="button"
           aria-label={showCurrentPass ? 'Hide password' : 'Show password'}
           onClick={() => setShowCurrentPass((v) => !v)}
           className="absolute right-0.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
           {showCurrentPass ? <EyeOff className="w-4 h-4 pointer-events-none" /> : <Eye className="w-4 h-4 pointer-events-none" />}
          </button>
         </div>
        </div>

        <div className="space-y-1.5">
         <Label className="text-xs text-muted-foreground font-medium">New Password</Label>
         <div className="relative">
          <Input
           type={showNewPass ? 'text' : 'password'}
           value={newPassword}
           onChange={(e) => setNewPassword(e.target.value)}
           className={`${inputClass} pr-10`}
           placeholder="Enter new password"
           autoComplete="new-password"
          />
          <button
           type="button"
           aria-label={showNewPass ? 'Hide password' : 'Show password'}
           onClick={() => setShowNewPass((v) => !v)}
           className="absolute right-0.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
           {showNewPass ? <EyeOff className="w-4 h-4 pointer-events-none" /> : <Eye className="w-4 h-4 pointer-events-none" />}
          </button>
         </div>
        </div>

        <div className="space-y-1.5">
         <Label className="text-xs text-muted-foreground font-medium">Confirm New Password</Label>
         <div className="relative">
          <Input
           type={showConfirmPass ? 'text' : 'password'}
           value={confirmPassword}
           onChange={(e) => setConfirmPassword(e.target.value)}
           className={`${inputClass} pr-10`}
           placeholder="Confirm new password"
           autoComplete="new-password"
          />
          <button
           type="button"
           aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
           onClick={() => setShowConfirmPass((v) => !v)}
           className="absolute right-0.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
           {showConfirmPass ? <EyeOff className="w-4 h-4 pointer-events-none" /> : <Eye className="w-4 h-4 pointer-events-none" />}
          </button>
         </div>
        </div>

        <Button
         onClick={handleChangePassword}
         disabled={passLoading || !currentPassword || !newPassword || !confirmPassword}
         className="hero-gradient text-white hover:opacity-90 border-0 shadow-soft-sm h-9 text-sm"
        >
         {passLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Lock className="w-4 h-4 mr-1.5" />}
         Change Password
        </Button>
       </div>
      </div>
     </div>
    </div>
   )}

   {/* Trial Settings Tab */}
   {activeTab === 'trial' && <TrialSettingsPanel inputClass={inputClass} />}

   {/* SMTP / Email Tab */}
   {activeTab === 'email' && (
    <div className="admin-card overflow-hidden">
     <div className="hero-gradient-soft p-6 border-b border-border/50">
      <div className="flex items-center gap-4">
       <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-soft-sm ring-1 ring-primary/20">
        <Mail className="w-6 h-6 text-primary" />
       </div>
       <div>
        <h3 className="text-lg font-bold text-foreground">Email (SMTP)</h3>
        <p className="text-sm text-muted-foreground">Configure outbound email for trial notifications and system messages</p>
       </div>
      </div>
     </div>

     <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20">
       <div>
        <p className="text-sm font-semibold text-foreground">Enable SMTP</p>
        <p className="text-xs text-muted-foreground mt-1">When off, emails are logged to the server console only.</p>
       </div>
       <Switch
        checked={smtpForm.enabled}
        onCheckedChange={(v) => setSmtpForm({ ...smtpForm, enabled: v })}
       />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div className="space-y-1.5 md:col-span-2">
        <Label className="text-xs text-muted-foreground font-medium">SMTP Host</Label>
        <Input
         value={smtpForm.host}
         onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
         className={inputClass}
         placeholder="smtp.gmail.com"
        />
       </div>
       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">Port</Label>
        <AdminNumberInput
         integer
         min={1}
         max={65535}
         emptyAs={587}
         value={smtpForm.port}
         onValueChange={(n) => setSmtpForm({ ...smtpForm, port: Math.min(65535, Math.max(1, Math.trunc(n) || 587)) })}
         className={inputClass}
        />
       </div>
       <div className="flex items-end pb-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
         <Switch
          checked={smtpForm.secure}
          onCheckedChange={(v) => setSmtpForm({ ...smtpForm, secure: v })}
         />
         <span className="text-muted-foreground">Use SSL/TLS (port 465)</span>
        </label>
       </div>
       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">Username</Label>
        <Input
         value={smtpForm.user}
         onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
         className={inputClass}
         placeholder="SMTP login"
        />
       </div>
       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">
         Password {smtpForm.hasPassword && !smtpForm.password && '(saved — leave blank to keep)'}
        </Label>
        <div className="relative">
         <Input
          type={showSmtpPass ? 'text' : 'password'}
          value={smtpForm.password}
          onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
          className={`${inputClass} pr-10`}
          placeholder={smtpForm.hasPassword ? '••••••••' : 'SMTP password'}
         />
         <button
          type="button"
          aria-label={showSmtpPass ? 'Hide password' : 'Show password'}
          onClick={() => setShowSmtpPass((v) => !v)}
          className="absolute right-0.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
         >
          {showSmtpPass ? <EyeOff className="w-4 h-4 pointer-events-none" /> : <Eye className="w-4 h-4 pointer-events-none" />}
         </button>
        </div>
       </div>
       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">From Email</Label>
        <Input
         type="email"
         value={smtpForm.fromEmail}
         onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
         className={inputClass}
        />
       </div>
       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">From Name</Label>
        <Input
         value={smtpForm.fromName}
         onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
         className={inputClass}
        />
       </div>
      </div>

      <div className="space-y-1.5">
       <Label className="text-xs text-muted-foreground font-medium">Test recipient</Label>
       <Input
        type="email"
        value={smtpForm.testEmail}
        onChange={(e) => setSmtpForm({ ...smtpForm, testEmail: e.target.value })}
        className={inputClass}
        placeholder={adminProfile?.email || 'you@example.com'}
       />
      </div>

      {smtpTestResult && (
       <div className={`p-4 rounded-xl border ${smtpTestResult.success ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
        <div className="flex items-center gap-2">
         {smtpTestResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
         <p className="text-sm">{smtpTestResult.message}</p>
        </div>
       </div>
      )}

      <div className="flex items-center gap-3 pt-2">
       <Button onClick={handleSaveSmtpSettings} disabled={smtpSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft-sm">
        {smtpSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
        Save SMTP Settings
       </Button>
       <Button variant="outline" onClick={handleTestSmtp} disabled={smtpTestLoading} className="border-primary/20 text-primary hover:bg-primary/5">
        {smtpTestLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Activity className="w-4 h-4 mr-1.5" />}
        Send Test Email
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
        <div className="relative">
         <Input 
          type={showApiKey ? "text" : "password"}
          value={trialvoPay.apiKey} 
          onChange={(e) => setTrialvoPay({...trialvoPay, apiKey: e.target.value})} 
          className={`${inputClass} pr-10`}
          placeholder="Secret API Key"
         />
         <button 
          type="button"
          aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
          onClick={() => setShowApiKey((v) => !v)}
          className="absolute right-0.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
         >
          {showApiKey ? <EyeOff className="w-4 h-4 pointer-events-none" /> : <Eye className="w-4 h-4 pointer-events-none" />}
         </button>
        </div>
       </div>
       <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-medium">Webhook (IPN) Secret</Label>
        <div className="relative">
         <Input 
          type={showIpnSecret ? "text" : "password"}
          value={trialvoPay.ipnSecret} 
          onChange={(e) => setTrialvoPay({...trialvoPay, ipnSecret: e.target.value})} 
          className={`${inputClass} pr-10`}
          placeholder="Used to verify incoming payments"
         />
         <button 
          type="button"
          aria-label={showIpnSecret ? 'Hide secret' : 'Show secret'}
          onClick={() => setShowIpnSecret((v) => !v)}
          className="absolute right-0.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
         >
          {showIpnSecret ? <EyeOff className="w-4 h-4 pointer-events-none" /> : <Eye className="w-4 h-4 pointer-events-none" />}
         </button>
        </div>
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
              <div className={`p-4 rounded-xl border space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 ${testResult.success ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-center gap-3">
                  {testResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                  <p className={`text-sm font-bold ${testResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                    {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-2 pl-8">
                  <div className="flex items-center justify-between py-1 border-b border-border/30">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Response Message</span>
                    <span className="text-xs font-medium text-foreground">{testResult.message}</span>
                  </div>
                  {(testResult as any).data && (
                    <>
                      <div className="flex items-center justify-between py-1 border-b border-border/30">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Verified Service ID</span>
                        <span className="text-xs font-mono text-primary">{(testResult as any).data.service_id}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-border/30">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</span>
                        <Badge variant="outline" className="h-4 text-[9px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 uppercase font-bold">
                          Authorized
                        </Badge>
                      </div>
                    </>
                  )}
                  {!(testResult as any).data && !testResult.success && (
                    <div className="text-xs text-red-500 italic mt-1">
                      Check your Service ID and API Key. Ensure the Base URL is correct.
                    </div>
                  )}
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
