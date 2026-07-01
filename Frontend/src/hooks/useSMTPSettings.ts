import { useQuery } from "@tanstack/react-query";
import { getAllSmtpSettings } from "@/services/stmpService";

export const useSMTPSettings = () => {
  return useQuery({
    queryKey: ["smtp-settings"],
    queryFn: getAllSmtpSettings,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
