import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getApplicants } from "@/services/applicantService";

export const useApplicantsList = (
  page: number,
  pageSize: number,
  search: string,
  status: string,
  jobPositionId: string,
) => {
  return useQuery({
    queryKey: ["applicants", page, pageSize, search, status, jobPositionId],
    queryFn: () => {
      const normalizedStatus = status === "all" ? "" : status;
      const normalizedJob = jobPositionId === "all" ? "" : jobPositionId;
      return getApplicants(page, pageSize, search, normalizedStatus, normalizedJob);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
