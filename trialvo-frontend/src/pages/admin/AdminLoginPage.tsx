import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const AdminLoginPage: React.FC = () => {
 const { signIn, user } = useAuth();
 const navigate = useNavigate();
 const { toast } = useToast();
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [isLoading, setIsLoading] = useState(false);

 // Redirect if already logged in
 React.useEffect(() => {
  if (user) navigate('/admin', { replace: true });
 }, [user, navigate]);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  const { error } = await signIn(email, password);

  if (error) {
   toast({
    title: 'Login Failed',
    description: error,
    variant: 'destructive',
   });
   setIsLoading(false);
  } else {
   navigate('/admin', { replace: true });
  }
 };

 return (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
   {/* Background decorations */}
   <div className="absolute inset-0 overflow-hidden">
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
   </div>

   <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="relative z-10 w-full max-w-md"
   >
    <Card className="border-border bg-card/90 backdrop-blur-xl shadow-2xl md:p-2">
     <CardHeader className="text-center pb-2">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl hero-gradient shadow-soft-sm flex items-center justify-center">
       <ShieldCheck className="w-8 h-8 text-primary-foreground" />
      </div>
      <CardTitle className="text-2xl font-bold text-foreground">Admin Panel</CardTitle>
      <CardDescription className="text-muted-foreground mt-1">
       Sign in to manage your store
      </CardDescription>
     </CardHeader>
     <CardContent>
      <form onSubmit={handleSubmit} className="space-y-5">
       <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
        <div className="relative">
         <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
         <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/25"
          required
         />
        </div>
       </div>

       <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
        <div className="relative">
         <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
         <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-10 pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/25"
          required
         />
         <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
         >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
         </button>
        </div>
       </div>

       <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 mt-2 text-base font-bold bg-primary text-primary-foreground shadow-soft-md hover:bg-primary/90 transition-all"
       >
        {isLoading ? (
         <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        ) : (
         <>
          <LogIn className="w-5 h-5 mr-2" />
          Sign In
         </>
        )}
       </Button>
      </form>
     </CardContent>
    </Card>

    <p className="text-center text-muted-foreground text-sm mt-8">
     © {new Date().getFullYear()} Trialvo Admin
    </p>
   </motion.div>
  </div>
 );
};

export default AdminLoginPage;
