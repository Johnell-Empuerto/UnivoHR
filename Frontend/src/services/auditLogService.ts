import api from "./api";

export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string | null;
  employee_id: number | null;
  branch_id: number | null;
  action: string;
  table_name: string;
  record_id: number | null;
  description: string | null;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditLogResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getAuditLogs = async (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    table_name?: string;
    date_from?: string;
    date_to?: string;
    user_id?: number;
  } = {}
): Promise<AuditLogResponse> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  const res = await api.get(`/audit-logs?${query.toString()}`);
  return res.data;
};
