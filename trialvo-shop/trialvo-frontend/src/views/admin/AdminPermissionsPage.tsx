"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import NotificationPermissionsPanel from '@/components/admin/NotificationPermissionsPanel';
import { useRequireSuperAdmin } from '@/hooks/admin/useRequireSuperAdmin';

const AdminPermissionsPage: React.FC = () => {
  const { allowed, isLoading } = useRequireSuperAdmin();

  if (isLoading || !allowed) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="admin-page-header">
        <h1>Permissions</h1>
        <p>Control which staff receive Email and SMS alerts for each event</p>
      </div>
      <NotificationPermissionsPanel />
    </div>
  );
};

export default AdminPermissionsPage;
