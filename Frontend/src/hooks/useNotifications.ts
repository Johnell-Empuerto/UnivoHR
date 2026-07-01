import { useQuery } from "@tanstack/react-query";
import { getMyNotifications } from "@/services/notificationService";

export const useNotifications = (page: number, pageSize: number, userId?: number) => {
  return useQuery({
    queryKey: ["notifications", page, pageSize, userId],
    queryFn: () => getMyNotifications(page, pageSize),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
