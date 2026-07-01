import { useQuery } from "@tanstack/react-query";
import { getDevices } from "@/services/deviceIntegrationService";

export const useDevices = (page: number, limit: number, search?: string) => {
  return useQuery({
    queryKey: ["devices", page, limit, search],
    queryFn: () => getDevices({ page, limit, search }),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
