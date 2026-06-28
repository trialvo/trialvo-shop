import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, removeToken, isTokenExpired } from '@/lib/api';

interface AdminProfile {
 id: string;
 email: string;
 full_name: string;
 avatar_url: string;
 role: 'super_admin' | 'admin' | 'editor';
}

interface AuthContextType {
 user: { id: string; email: string } | null;
 session: { token: string } | null;
 adminProfile: AdminProfile | null;
 isLoading: boolean;
 signIn: (email: string, password: string) => Promise<{ error: string | null }>;
 signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [user, setUser] = useState<{ id: string; email: string } | null>(null);
 const [session, setSession] = useState<{ token: string } | null>(null);
 const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 // Centralized sign-out logic
 const signOut = useCallback(async () => {
  removeToken();
  setSession(null);
  setUser(null);
  setAdminProfile(null);
 }, []);

 // On mount, check if token exists and fetch profile
 useEffect(() => {
  const token = localStorage.getItem('auth_token');
  if (token) {
   // Client-side expiry check first — avoid unnecessary API call
   if (isTokenExpired()) {
    removeToken();
    setIsLoading(false);
    return;
   }

   setSession({ token });
   api.get<{ admin: AdminProfile }>('/auth/me')
    .then(({ admin }) => {
     setUser({ id: admin.id, email: admin.email });
     setAdminProfile(admin);
    })
    .catch(() => {
     // Token is invalid/expired
     removeToken();
     setSession(null);
     setUser(null);
     setAdminProfile(null);
    })
    .finally(() => setIsLoading(false));
  } else {
   setIsLoading(false);
  }
 }, []);

 // Listen for 'auth:expired' event from api.ts (triggered on 401 responses)
 useEffect(() => {
  const handleAuthExpired = () => {
   signOut();
   // Redirect to login with expired flag (only if on admin page)
   if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
    window.location.href = '/admin/login?expired=true';
   }
  };

  window.addEventListener('auth:expired', handleAuthExpired);
  return () => window.removeEventListener('auth:expired', handleAuthExpired);
 }, [signOut]);

 // Periodic token expiry check (every 60 seconds)
 useEffect(() => {
  if (!session) return;

  const interval = setInterval(() => {
   if (isTokenExpired()) {
    signOut();
    if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
     window.location.href = '/admin/login?expired=true';
    }
   }
  }, 60_000); // Check every 60 seconds

  return () => clearInterval(interval);
 }, [session, signOut]);

 const signIn = async (email: string, password: string) => {
  try {
   const data = await api.post<{ token: string; admin: AdminProfile }>('/auth/login', { email, password });
   setToken(data.token);
   setSession({ token: data.token });
   setUser({ id: data.admin.id, email: data.admin.email });
   setAdminProfile(data.admin);
   return { error: null };
  } catch (err: any) {
   return { error: err.message || 'Login failed' };
  }
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

