import React, { useState } from 'react';
import { User, Lock, Loader2, Save, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const AdminSettingsPage: React.FC = () => {
 const { toast } = useToast();
 const { adminProfile, user } = useAuth();

 const [fullName, setFullName] = useState(adminProfile?.full_name || '');
 const [nameLoading, setNameLoading] = useState(false);

 const [currentPassword, setCurrentPassword] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [passLoading, setPassLoading] = useState(false);

 const handleUpdateName = async () => {
  if (!user) return;
  setNameLoading(true);
  try {
   const { error } = await supabase
    .from('admin_profiles')
    .update({ full_name: fullName })
    .eq('id', user.id);
   if (error) throw error;
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
   const { error } = await supabase.auth.updateUser({ password: newPassword });
   if (error) throw error;
   toast({ title: 'Password changed successfully' });
   setCurrentPassword('');
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
    <h1 className="text-2xl font-bold text-white">Settings</h1>
    <p className="text-sm text-gray-400">Manage your admin profile</p>
   </div>

   {/* Profile Info */}
   <Card className="bg-[#161822] border-white/[0.08]">
    <CardHeader>
     <CardTitle className="text-white flex items-center gap-2">
      <User className="w-5 h-5 text-gray-400" />
      Profile Information
     </CardTitle>
     <CardDescription className="text-gray-400">Update your account details</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
     <div className="flex items-center gap-4 pb-4 border-b border-white/[0.08]">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
       <span className="text-2xl font-bold text-white">
        {adminProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
       </span>
      </div>
      <div>
       <p className="text-lg font-semibold text-white">{adminProfile?.full_name}</p>
       <p className="text-sm text-gray-400">{adminProfile?.email}</p>
       <Badge variant="outline" className="mt-1 text-xs border-primary/30 text-primary bg-primary/10">
        <ShieldCheck className="w-3 h-3 mr-1" />
        {adminProfile?.role?.replace('_', ' ')}
       </Badge>
      </div>
     </div>

     <div className="space-y-2">
      <Label className="text-gray-300">Full Name</Label>
      <Input
       value={fullName}
       onChange={(e) => setFullName(e.target.value)}
       className="bg-white/5 border-white/10 text-white"
      />
     </div>

     <div className="space-y-2">
      <Label className="text-gray-300">Email</Label>
      <Input
       value={adminProfile?.email || ''}
       disabled
       className="bg-white/5/30 border-white/10 text-gray-400"
      />
     </div>

     <Button
      onClick={handleUpdateName}
      disabled={nameLoading}
      className="bg-primary"
     >
      {nameLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
      Save Changes
     </Button>
    </CardContent>
   </Card>

   {/* Change Password */}
   <Card className="bg-[#161822] border-white/[0.08]">
    <CardHeader>
     <CardTitle className="text-white flex items-center gap-2">
      <Lock className="w-5 h-5 text-gray-400" />
      Change Password
     </CardTitle>
     <CardDescription className="text-gray-400">Update your login password</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
     <div className="space-y-2">
      <Label className="text-gray-300">New Password</Label>
      <Input
       type="password"
       value={newPassword}
       onChange={(e) => setNewPassword(e.target.value)}
       className="bg-white/5 border-white/10 text-white"
       placeholder="••••••••"
      />
     </div>

     <div className="space-y-2">
      <Label className="text-gray-300">Confirm New Password</Label>
      <Input
       type="password"
       value={confirmPassword}
       onChange={(e) => setConfirmPassword(e.target.value)}
       className="bg-white/5 border-white/10 text-white"
       placeholder="••••••••"
      />
     </div>

     <Button
      onClick={handleChangePassword}
      disabled={passLoading || !newPassword || !confirmPassword}
      className="bg-primary"
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
