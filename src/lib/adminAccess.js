import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const LOCAL_ADMIN_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function useAdminAccess() {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocalAdmin = LOCAL_ADMIN_HOSTS.has(hostname);

  const { data: authUser, isLoading } = useQuery({
    queryKey: ["auth-me", isLocalAdmin ? "local" : "remote"],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 30_000,
  });

  const isRemoteAdmin = !isLocalAdmin && authUser?.role === "admin";

  return {
    authUser,
    isLoading,
    isLocalAdmin,
    isRemoteAdmin,
    hasAdminAccess: isLocalAdmin || isRemoteAdmin,
  };
}
