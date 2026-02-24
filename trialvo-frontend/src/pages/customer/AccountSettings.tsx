import React, { useState } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, User, Lock, Mail, Phone, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
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
   toast({ title: 'Profile updated successfully ✓' });
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
   toast({ title: 'Password changed successfully ✓' });
   setCurrentPassword('');
   setNewPassword('');
   setConfirmPassword('');
  }
 };

 return (
  <div className="space-y-6">
   {/* Header */}
   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
    <p className="text-sm text-muted-foreground mt-1">Manage your profile information and security</p>
   </motion.div>

   {/* Profile Section */}
   <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.05 }}
    className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm"
   >
    <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-muted/20">
     <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
      <User className="w-4 h-4 text-primary" />
     </div>
     <div>
      <h3 className="text-sm font-bold text-foreground">Profile Information</h3>
      <p className="text-[11px] text-muted-foreground">Update your personal details</p>
     </div>
    </div>
    <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
     <div className="grid sm:grid-cols-2 gap-5">
      <div className="sm:col-span-2">
       <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
        <Mail className="w-3 h-3" /> Email Address
       </Label>
       <Input
        value={customer?.email || ''}
        disabled
        className="bg-muted/40 border-border/40 text-muted-foreground h-11 rounded-xl"
       />
       <p className="text-[11px] text-muted-foreground/60 mt-1.5">Email cannot be changed</p>
      </div>
      <div>
       <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
        <User className="w-3 h-3" /> Full Name
       </Label>
       <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="bg-background border-border/60 h-11 rounded-xl focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
       />
      </div>
      <div>
       <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
        <Phone className="w-3 h-3" /> Phone Number
       </Label>
       <Input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="01XXXXXXXXX"
        className="bg-background border-border/60 h-11 rounded-xl focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
       />
      </div>
     </div>
     <div className="pt-1">
      <Button
       type="submit"
       className="rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/10 hover:shadow-lg h-10 px-6"
       disabled={profileLoading}
      >
       {profileLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
       Save Changes
      </Button>
     </div>
    </form>
   </motion.div>

   {/* Password Section */}
   <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm"
   >
    <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-muted/20">
     <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
      <Shield className="w-4 h-4 text-amber-500" />
     </div>
     <div>
      <h3 className="text-sm font-bold text-foreground">Security</h3>
      <p className="text-[11px] text-muted-foreground">Change your password</p>
     </div>
    </div>
    <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
     <div>
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
       <Lock className="w-3 h-3" /> Current Password
      </Label>
      <Input
       type="password"
       value={currentPassword}
       onChange={(e) => setCurrentPassword(e.target.value)}
       required
       className="bg-background border-border/60 h-11 rounded-xl focus:border-primary/30 focus:ring-2 focus:ring-primary/10 max-w-md"
      />
     </div>
     <div className="grid sm:grid-cols-2 gap-5">
      <div>
       <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
        <Lock className="w-3 h-3" /> New Password
       </Label>
       <Input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Min 6 characters"
        required
        className="bg-background border-border/60 h-11 rounded-xl focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
       />
      </div>
      <div>
       <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
        <Lock className="w-3 h-3" /> Confirm Password
       </Label>
       <Input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        className="bg-background border-border/60 h-11 rounded-xl focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
       />
      </div>
     </div>
     <div className="pt-1">
      <Button
       type="submit"
       variant="outline"
       className="rounded-xl border-border/60 hover:border-primary/30 h-10 px-6"
       disabled={passwordLoading}
      >
       {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
       Change Password
      </Button>
     </div>
    </form>
   </motion.div>
  </div>
 );
};

export default AccountSettings;
