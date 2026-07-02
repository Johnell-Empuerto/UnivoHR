import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getEmployeeSalary } from "@/services/payrollService";

export const useEmployeeSalaryList = (page: number, limit: number, search: string) => {
  return useQuery({
    queryKey: ["employee-salary-list", page, limit, search],
    queryFn: () => getEmployeeSalary(page, limit, search),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
