import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useAdminAccess() {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 30_000,
  });

  const isAdmin =
    authUser?.role === "admin" && authUser?.auth_method === "google";

  return {
    authUser,
    isLoading,
    isAdmin,
    hasAdminAccess: isAdmin,
  };
}
