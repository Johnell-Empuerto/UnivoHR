import { useQuery } from "@tanstack/react-query";
import { getMyInterviews } from "@/services/applicantInterviewService";

export const useMyInterviews = () => {
  return useQuery({
    queryKey: ["my-interviews"],
    queryFn: () => getMyInterviews().catch(() => []),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
