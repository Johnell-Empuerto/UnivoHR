import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { employees } from "@/services/employeeService";

export const useEmployeeList = (
  page: number,
  limit: number,
  search: string,
  status: string,
  branch: string,
) => {
  return useQuery({
    queryKey: ["employees", page, limit, search, status, branch],
    queryFn: () => employees(page, limit, search, status, branch),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
