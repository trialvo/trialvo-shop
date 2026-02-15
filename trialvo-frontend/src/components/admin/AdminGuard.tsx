import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const { user, isLoading } = useAuth();
 const location = useLocation();

 if (isLoading) {
  return (
   <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-10 h-10 animate-spin text-primary" />
   </div>
  );
 }

 if (!user) {
  return <Navigate to="/admin/login" state={{ from: location }} replace />;
 }

 return <>{children}</>;
};

export default AdminGuard;
