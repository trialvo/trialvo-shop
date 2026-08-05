import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";

export type AdminRoleDto = {
  id: number;
  name: string; // e.g. "SUPER_ADMIN"
  is_system: number;
};

export function useAdminRoles() {
  return useQuery({
    queryKey: ["roles", "all"],
    queryFn: async () => {
      // baseURL already includes /api/v1 in your project style (like /admin/login)
      const res = await api.get<AdminRoleDto[]>("/admin/getAllRoles");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
