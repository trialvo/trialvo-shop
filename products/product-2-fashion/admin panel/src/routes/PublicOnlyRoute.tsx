import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import FullPageLoading from "@/components/auth/FullPageLoading";
import { useAuth } from "@/context/AuthProvider";

export default function PublicOnlyRoute() {
  const { hydrated, isAuthed } = useAuth();

  if (!hydrated) return <FullPageLoading />;
  if (isAuthed) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
