import { useQuery } from "@tanstack/react-query";
import { getApprovalRequests } from "@/services/payrollApprovalService";

export const usePayrollApprovals = (branchId?: string, status?: string) => {
  return useQuery({
    queryKey: ["payroll-approvals", branchId, status],
    queryFn: () => getApprovalRequests(branchId, status),
    staleTime: 30 * 1000,
  });
};
