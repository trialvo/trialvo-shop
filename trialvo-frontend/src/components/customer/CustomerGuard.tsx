import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { Loader2 } from 'lucide-react';

const CustomerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const { isLoggedIn, isLoading } = useCustomerAuth();

 if (isLoading) {
  return (
   <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
   </div>
  );
 }

 if (!isLoggedIn) {
  return <Navigate to="/login" replace />;
 }

 return <>{children}</>;
};

export default CustomerGuard;
