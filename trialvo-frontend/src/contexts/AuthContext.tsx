import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, removeToken } from '@/lib/api';

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

 // On mount, check if token exists and fetch profile
 useEffect(() => {
  const token = localStorage.getItem('auth_token');
  if (token) {
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

 const signOut = async () => {
  removeToken();
  setSession(null);
  setUser(null);
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
