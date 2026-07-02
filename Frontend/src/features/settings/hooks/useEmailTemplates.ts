import { useQuery } from "@tanstack/react-query";
import { getAllTemplates } from "@/services/emailTemplateService";

export const useEmailTemplates = () => {
  return useQuery({
    queryKey: ["email-templates"],
    queryFn: () => getAllTemplates(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
