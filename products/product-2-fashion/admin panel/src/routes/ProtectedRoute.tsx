import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import FullPageLoading from "@/components/auth/FullPageLoading";
import AccessDenied from "@/components/common/AccessDenied";
import { useAuth } from "@/context/AuthProvider";

type Props = {
  roles?: string[];
  permissions?: string[];
  redirectTo?: string;      // default "/" — used only for unauthenticated users
  /** If true (default), render an in-page AccessDenied card instead of
   *  redirecting to /dashboard when role/permission check fails. */
  inPageDenied?: boolean;
  /** Title shown on the AccessDenied card */
  deniedTitle?: string;
  /** Body text shown on the AccessDenied card */
  deniedDescription?: string;
  /** Extra hint shown on the AccessDenied card */
  deniedHint?: string;
};

export default function ProtectedRoute({
  roles,
  permissions,
  redirectTo = "/",
  inPageDenied = false,
  deniedTitle,
  deniedDescription,
  deniedHint,
}: Props) {
  const { hydrated, isAuthed, hasAnyRole, hasPermission } = useAuth();
  const location = useLocation();

  if (!hydrated) return <FullPageLoading />;

  // Not logged in → redirect to login
  if (!isAuthed) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Role check
  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    if (inPageDenied) {
      return (
        <AccessDenied
          title={deniedTitle}
          description={deniedDescription}
          hint={deniedHint}
        />
      );
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Permission check
  if (permissions && permissions.length > 0) {
    const ok = permissions.every((p) => hasPermission(p));
    if (!ok) {
      if (inPageDenied) {
        return (
          <AccessDenied
            title={deniedTitle}
            description={deniedDescription}
            hint={deniedHint}
          />
        );
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
