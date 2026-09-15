import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/** Activity log is for super_admin + admin; editors are redirected away. */
export function useRequireOpsAdmin(redirectTo = '/admin/products') {
  const { adminProfile, isLoading } = useAuth();
  const router = useRouter();
  const allowed = adminProfile?.role === 'super_admin' || adminProfile?.role === 'admin';

  useEffect(() => {
    if (!isLoading && adminProfile && !allowed) {
      router.replace(redirectTo);
    }
  }, [adminProfile, allowed, isLoading, redirectTo, router]);

  return { allowed, isLoading: isLoading || !adminProfile };
}
