import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthProvider";
import { fetchDashboardData } from "@/api/dashboard";

export const useDashboardData = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboardData', user?.id],
    queryFn: () => fetchDashboardData(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
};