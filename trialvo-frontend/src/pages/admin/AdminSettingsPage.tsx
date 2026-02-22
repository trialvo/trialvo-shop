import React, { useState } from 'react';
import { User, Lock, Loader2, Save, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

 return (
  <div className="space-y-6 max-w-2xl">
   <div>
    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
    <p className="text-sm text-muted-foreground mt-1">Manage your admin profile</p>
   </div>

   {/* Profile Info */}
   <Card className="bg-card border-border card-shadow">
    <CardHeader className="border-b border-border pb-4 mb-4">
     <CardTitle className="text-foreground flex items-center gap-2">
      <User className="w-5 h-5 text-primary" />
      Profile Information
     </CardTitle>
     <CardDescription className="text-muted-foreground">Update your account details</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
     <div className="flex items-center gap-5 pb-6 border-b border-border/50">
      <div className="w-16 h-16 rounded-2xl hero-gradient shadow-soft-sm flex items-center justify-center">
       <span className="text-2xl font-bold text-primary-foreground">
        {adminProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
       </span>
      </div>
      <div>
       <p className="text-lg font-bold text-foreground">{adminProfile?.full_name}</p>
       <p className="text-sm text-muted-foreground mt-0.5">{adminProfile?.email}</p>
       <Badge variant="outline" className="mt-2 text-xs font-semibold tracking-wide uppercase border-primary/30 text-primary bg-primary/10">
        <ShieldCheck className="w-3 h-3 mr-1" />
        {adminProfile?.role?.replace('_', ' ')}
       </Badge>
      </div>
     </div>

     <div className="space-y-2.5">
      <Label className="text-foreground font-medium">Full Name</Label>
      <Input
       value={fullName}
       onChange={(e) => setFullName(e.target.value)}
       className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/25"
      />
     </div>

     <div className="space-y-2.5">
      <Label className="text-foreground font-medium">Email</Label>
      <Input
       value={adminProfile?.email || ''}
       disabled
       className="bg-muted border-border text-muted-foreground opacity-70"
      />
     </div>

     <Button
      onClick={handleUpdateName}
      disabled={nameLoading}
      className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft-sm mt-2"
     >
      {nameLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
      Save Changes
     </Button>
    </CardContent>
   </Card>

   {/* Change Password */}
   <Card className="bg-card border-border card-shadow">
    <CardHeader className="border-b border-border pb-4 mb-4">
     <CardTitle className="text-foreground flex items-center gap-2">
      <Lock className="w-5 h-5 text-primary" />
      Change Password
     </CardTitle>
     <CardDescription className="text-muted-foreground">Update your login password</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
     <div className="space-y-2.5">
      <Label className="text-foreground font-medium">New Password</Label>
      <Input
       type="password"
       value={newPassword}
       onChange={(e) => setNewPassword(e.target.value)}
       className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/25"
       placeholder="••••••••"
      />
     </div>

     <div className="space-y-2.5">
      <Label className="text-foreground font-medium">Confirm New Password</Label>
      <Input
       type="password"
       value={confirmPassword}
       onChange={(e) => setConfirmPassword(e.target.value)}
       className="bg-background border-border text-foreground focus:border-primary focus:ring-primary/25"
       placeholder="••••••••"
      />
     </div>

     <Button
      onClick={handleChangePassword}
      disabled={passLoading || !newPassword || !confirmPassword}
      className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft-sm mt-2"
     >
      {passLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
      Change Password
     </Button>
    </CardContent>
   </Card>
  </div>
 );
};

export default AdminSettingsPage;
