import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/** Redirect non-super_admins away from staff / permissions pages. */
export function useRequireSuperAdmin(redirectTo = '/admin/settings') {
  const { adminProfile, isLoading } = useAuth();
  const router = useRouter();
  const allowed = adminProfile?.role === 'super_admin';

  useEffect(() => {
    if (!isLoading && adminProfile && !allowed) {
      router.replace(redirectTo);
    }
  }, [adminProfile, allowed, isLoading, redirectTo, router]);

  return { allowed, isLoading: isLoading || !adminProfile };
}
