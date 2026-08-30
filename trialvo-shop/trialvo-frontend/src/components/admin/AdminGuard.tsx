"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const { user, isLoading } = useAuth();
 const router = useRouter();

 useEffect(() => {
  if (!isLoading && !user) {
   router.replace('/admin/login');
  }
 }, [isLoading, user, router]);

 if (isLoading || !user) {
  return (
   <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-10 h-10 animate-spin text-primary" />
   </div>
  );
 }

 return <>{children}</>;
};

export default AdminGuard;
