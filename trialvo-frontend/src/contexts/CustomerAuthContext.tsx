import React, { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface CustomerProfile {
 id: string;
 name: string;
 email: string;
 phone: string | null;
 avatar_url: string | null;
 is_verified: boolean;
 created_at?: string;
}

interface CustomerAuthContextType {
 customer: CustomerProfile | null;
 isLoading: boolean;
 isLoggedIn: boolean;
 login: (email: string, password: string) => Promise<{ error: string | null }>;
 register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<{ error: string | null }>;
 logout: () => void;
 updateProfile: (data: Partial<CustomerProfile>) => Promise<{ error: string | null }>;
 changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>;
 token: string | null;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

function getCustomerToken(): string | null {
 return localStorage.getItem('customer_token');
}

function setCustomerToken(token: string) {
 localStorage.setItem('customer_token', token);
}

function removeCustomerToken() {
 localStorage.removeItem('customer_token');
}

async function customerApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
 const token = getCustomerToken();
 const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  ...((options.headers as Record<string, string>) || {}),
 };
 if (token) {
  headers['Authorization'] = `Bearer ${token}`;
 }

 const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
 if (!res.ok) {
  const body = await res.json().catch(() => ({ error: res.statusText }));
  throw new Error(body.error || `Request failed: ${res.status}`);
 }
 return res.json();
}

export const customerApiHelper = {
 get: <T>(endpoint: string) => customerApi<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) => customerApi<T>(endpoint, {method: 'POST', body: JSON.stringify(data) }),
   put: <T>(endpoint: string, data: unknown) => customerApi<T>(endpoint, {method: 'PUT', body: JSON.stringify(data) }),
    delete: <T>(endpoint: string) => customerApi<T>(endpoint, {method: 'DELETE' }),
};

     export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
 const [customer, setCustomer] = useState<CustomerProfile | null>(null);
     const [isLoading, setIsLoading] = useState(true);
     const [token, setToken] = useState<string | null>(getCustomerToken());

 useEffect(() => {
  const t = getCustomerToken();
     if (t) {
      customerApi<{ customer: CustomerProfile }>('/customer/me')
       .then(({ customer }) => {
        setCustomer(customer);
        setToken(t);
       })
       .catch(() => {
        removeCustomerToken();
        setCustomer(null);
        setToken(null);
       })
       .finally(() => setIsLoading(false));
  } else {
      setIsLoading(false);
  }
 }, []);

 const login = async (email: string, password: string) => {
  try {
   const data = await customerApi<{ token: string; customer: CustomerProfile }>('/customer/login', {
      method: 'POST',
     body: JSON.stringify({email, password}),
   });
     setCustomerToken(data.token);
     setToken(data.token);
     setCustomer(data.customer);
     return {error: null };
  } catch (err: any) {
   return {error: err.message || 'Login failed' };
  }
 };

     const register = async (data: {name: string; email: string; password: string; phone?: string }) => {
  try {
   const result = await customerApi<{ token: string; customer: CustomerProfile }>('/customer/register', {
      method: 'POST',
     body: JSON.stringify(data),
   });
     setCustomerToken(result.token);
     setToken(result.token);
     setCustomer(result.customer);
     return {error: null };
  } catch (err: any) {
   return {error: err.message || 'Registration failed' };
  }
 };

 const logout = () => {
      removeCustomerToken();
     setToken(null);
     setCustomer(null);
 };

     const updateProfile = async (data: Partial<CustomerProfile>) => {
  try {
   const result = await customerApi<{ customer: CustomerProfile }>('/customer/profile', {
       method: 'PUT',
      body: JSON.stringify(data),
   });
      setCustomer(result.customer);
      return {error: null };
  } catch (err: any) {
   return {error: err.message || 'Update failed' };
  }
 };

 const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
       await customerApi<{ message: string }>('/customer/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
       });
      return {error: null };
  } catch (err: any) {
   return {error: err.message || 'Password change failed' };
  }
 };

      return (
      <CustomerAuthContext.Provider value={{ customer, isLoading, isLoggedIn: !!customer, login, register, logout, updateProfile, changePassword, token }}>
       {children}
      </CustomerAuthContext.Provider>
      );
};

export const useCustomerAuth = () => {
 const context = useContext(CustomerAuthContext);
      if (!context) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
      return context;
};
