import React, { useState } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, User, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AccountSettings: React.FC = () => {
 const { customer, updateProfile, changePassword } = useCustomerAuth();
 const { toast } = useToast();

 const [name, setName] = useState(customer?.name || '');
 const [phone, setPhone] = useState(customer?.phone || '');
 const [profileLoading, setProfileLoading] = useState(false);

 const [currentPassword, setCurrentPassword] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [passwordLoading, setPasswordLoading] = useState(false);

 const handleProfileSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setProfileLoading(true);
  const { error } = await updateProfile({ name, phone });
  setProfileLoading(false);
  if (error) {
   toast({ title: 'Error', description: error, variant: 'destructive' });
  } else {
   toast({ title: 'Profile updated' });
  }
 };

 const handlePasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (newPassword !== confirmPassword) {
   toast({ title: 'Passwords do not match', variant: 'destructive' });
   return;
  }
  if (newPassword.length < 6) {
   toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
   return;
  }
  setPasswordLoading(true);
  const { error } = await changePassword(currentPassword, newPassword);
  setPasswordLoading(false);
  if (error) {
   toast({ title: 'Error', description: error, variant: 'destructive' });
  } else {
   toast({ title: 'Password changed successfully' });
   setCurrentPassword('');
   setNewPassword('');
   setConfirmPassword('');
  }
 };

 return (
  <div className="space-y-6">
   <div>
    <h1 className="text-xl font-bold text-foreground">Account Settings</h1>
    <p className="text-sm text-muted-foreground mt-0.5">Update your profile and security</p>
   </div>

   {/* Profile */}
   <div className="rounded-2xl border border-border bg-card overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
     <User className="w-4 h-4 text-primary" />
     <h3 className="text-sm font-semibold text-foreground">Profile Information</h3>
    </div>
    <form onSubmit={handleProfileSubmit} className="p-5 space-y-4">
     <div>
      <Label className="text-sm font-medium mb-1.5 block">Email</Label>
      <Input value={customer?.email || ''} disabled className="bg-muted border-border text-muted-foreground" />
     </div>
     <div>
      <Label className="text-sm font-medium mb-1.5 block">Full Name</Label>
      <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background border-border" />
     </div>
     <div>
      <Label className="text-sm font-medium mb-1.5 block">Phone</Label>
      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="bg-background border-border" />
     </div>
     <Button type="submit" className="hero-gradient text-primary-foreground" disabled={profileLoading}>
      {profileLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
      Save Changes
     </Button>
    </form>
   </div>

   {/* Password */}
   <div className="rounded-2xl border border-border bg-card overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
     <Lock className="w-4 h-4 text-primary" />
     <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
    </div>
    <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
     <div>
      <Label className="text-sm font-medium mb-1.5 block">Current Password</Label>
      <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="bg-background border-border" />
     </div>
     <div>
      <Label className="text-sm font-medium mb-1.5 block">New Password</Label>
      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required className="bg-background border-border" />
     </div>
     <div>
      <Label className="text-sm font-medium mb-1.5 block">Confirm New Password</Label>
      <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-background border-border" />
     </div>
     <Button type="submit" variant="outline" className="border-border" disabled={passwordLoading}>
      {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
      Change Password
     </Button>
    </form>
   </div>
  </div>
 );
};

export default AccountSettings;
