import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AdminProfile {
 id: string;
 email: string;
 full_name: string;
 avatar_url: string;
 role: 'super_admin' | 'admin' | 'editor';
}

interface AuthContextType {
 user: User | null;
 session: Session | null;
 adminProfile: AdminProfile | null;
 isLoading: boolean;
 signIn: (email: string, password: string) => Promise<{ error: string | null }>;
 signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [user, setUser] = useState<User | null>(null);
 const [session, setSession] = useState<Session | null>(null);
 const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 const fetchAdminProfile = async (userId: string) => {
  const { data, error } = await supabase
   .from('admin_profiles')
   .select('*')
   .eq('id', userId)
   .single();

  if (!error && data) {
   setAdminProfile(data as AdminProfile);
  } else {
   setAdminProfile(null);
  }
 };

 useEffect(() => {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
   setSession(session);
   setUser(session?.user ?? null);
   if (session?.user) {
    fetchAdminProfile(session.user.id);
   }
   setIsLoading(false);
  });

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
   async (_event, session) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
     await fetchAdminProfile(session.user.id);
    } else {
     setAdminProfile(null);
    }
    setIsLoading(false);
   }
  );

  return () => subscription.unsubscribe();
 }, []);

 const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
 };

 const signOut = async () => {
  await supabase.auth.signOut();
  setAdminProfile(null);
 };

 return (
  <AuthContext.Provider value={{ user, session, adminProfile, isLoading, signIn, signOut }}>
   {children}
  </AuthContext.Provider>
 );
};

export const useAuth = () => {
 const context = useContext(AuthContext);
 if (!context) throw new Error('useAuth must be used within AuthProvider');
 return context;
};
