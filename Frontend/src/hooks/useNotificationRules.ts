import { useQuery } from "@tanstack/react-query";
import { getAllRules } from "@/services/notificationRuleService";

export const useNotificationRules = () => {
  return useQuery({
    queryKey: ["notification-rules"],
    queryFn: getAllRules,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
