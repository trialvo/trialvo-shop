import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, UserPlus } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const RegisterPage: React.FC = () => {
 const { register, isLoggedIn } = useCustomerAuth();
 const navigate = useNavigate();
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [phone, setPhone] = useState('');
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 if (isLoggedIn) return <Navigate to="/account" replace />;

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (password !== confirmPassword) {
   setError('Passwords do not match');
   return;
  }

  if (password.length < 6) {
   setError('Password must be at least 6 characters');
   return;
  }

  setLoading(true);
  const { error } = await register({ name, email, password, phone: phone || undefined });
  setLoading(false);
  if (error) {
   setError(error);
  } else {
   navigate('/account');
  }
 };

 return (
  <div className="min-h-screen bg-background flex flex-col">
   <Navbar />
   <main className="flex-1 flex items-center justify-center px-4 py-16">
    <div className="w-full max-w-md">
     <div className="text-center mb-8">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
       <UserPlus className="w-7 h-7 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
      <p className="text-muted-foreground text-sm mt-1">Join us to manage your orders</p>
     </div>

     <div className="rounded-2xl border border-border bg-card p-6 shadow-soft-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
       {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
         {error}
        </div>
       )}

       <div>
        <Label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required className="bg-background border-border" />
       </div>

       <div>
        <Label className="text-sm font-medium text-foreground mb-1.5 block">Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="bg-background border-border" />
       </div>

       <div>
        <Label className="text-sm font-medium text-foreground mb-1.5 block">Phone (optional)</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="bg-background border-border" />
       </div>

       <div>
        <Label className="text-sm font-medium text-foreground mb-1.5 block">Password</Label>
        <div className="relative">
         <Input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 6 characters"
          required
          className="bg-background border-border pr-10"
         />
         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
         </button>
        </div>
       </div>

       <div>
        <Label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</Label>
        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="bg-background border-border" />
       </div>

       <Button type="submit" className="w-full hero-gradient text-primary-foreground h-11 font-semibold" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Create Account
       </Button>
      </form>

      <div className="mt-5 text-center text-sm text-muted-foreground">
       Already have an account?{' '}
       <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
      </div>
     </div>
    </div>
   </main>
   <Footer />
  </div>
 );
};

export default RegisterPage;
