import { useQuery } from "@tanstack/react-query";
import { getEmployeesWithoutAccounts } from "@/services/userService";

export const useEmployeesWithoutAccounts = () => {
  return useQuery({
    queryKey: ["employees-without-accounts"],
    queryFn: getEmployeesWithoutAccounts,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
