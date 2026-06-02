import api from "./api";

export interface RotationGroup {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  member_count?: number;
}

export interface GroupMember {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  department: string;
  status: string;
  position_name: string;
  effective_date: string;
  end_date: string | null;
}

export interface RotationPatternStep {
  id?: number;
  pattern_id?: number;
  day_offset: number;
  shift_id: number | null;
  is_rest_day: boolean;
  shift_name?: string | null;
  shift_code?: string | null;
  shift_type?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_night_shift?: boolean | null;
  is_flexitime?: boolean | null;
}

export interface RotationPattern {
  id: number;
  name: string;
  description: string | null;
  cycle_days: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  steps_count?: number;
  steps?: RotationPatternStep[];
}

export interface GroupAssignment {
  id: number;
  group_id: number;
  pattern_id: number;
  effective_date: string;
  end_date: string | null;
  created_at?: string;
  updated_at?: string;
  group_name: string;
  pattern_name: string;
  cycle_days: number;
}

export interface EmployeeRotationAssignment {
  id: number;
  employee_id: number;
  rotation_group_id: number;
  effective_date: string;
  end_date: string | null;
  created_at?: string;
  updated_at?: string;
  group_name: string;
  group_code: string | null;
}

// === GROUPS ===

export const getRotationGroups = async (): Promise<RotationGroup[]> => {
  const response = await api.get("/rotation/groups");
  return response.data;
};

export const getRotationGroup = async (id: number): Promise<RotationGroup> => {
  const response = await api.get(`/rotation/groups/${id}`);
  return response.data;
};

export const createRotationGroup = async (
  data: Partial<RotationGroup>
): Promise<RotationGroup> => {
  const response = await api.post("/rotation/groups", data);
  return response.data;
};

export const updateRotationGroup = async (
  id: number,
  data: Partial<RotationGroup>
): Promise<RotationGroup> => {
  const response = await api.put(`/rotation/groups/${id}`, data);
  return response.data;
};

export const deleteRotationGroup = async (id: number): Promise<RotationGroup> => {
  const response = await api.delete(`/rotation/groups/${id}`);
  return response.data;
};

// === GROUP MEMBERS ===

export const getGroupMembers = async (groupId: number): Promise<GroupMember[]> => {
  const response = await api.get(`/rotation/groups/${groupId}/members`);
  return response.data;
};

export const addGroupMembers = async (
  groupId: number,
  employeeIds: number[],
  effectiveDate?: string
): Promise<{ success: boolean; count: number; assignments: any[] }> => {
  const response = await api.post(`/rotation/groups/${groupId}/members`, {
    employee_ids: employeeIds,
    effective_date: effectiveDate,
  });
  return response.data;
};

export const removeGroupMember = async (
  groupId: number,
  employeeId: number,
  effectiveDate?: string
): Promise<any> => {
  const response = await api.put(`/rotation/groups/${groupId}/members/${employeeId}`, {
    effective_date: effectiveDate,
  });
  return response.data;
};

// === EMPLOYEE ROTATION ASSIGNMENTS ===

export const getEmployeeRotationAssignments = async (
  employeeId: number
): Promise<EmployeeRotationAssignment[]> => {
  const response = await api.get(`/rotation/employees/${employeeId}/assignments`);
  return response.data;
};

// === PATTERNS ===

export const getRotationPatterns = async (): Promise<RotationPattern[]> => {
  const response = await api.get("/rotation/patterns");
  return response.data;
};

export const getRotationPattern = async (id: number): Promise<RotationPattern> => {
  const response = await api.get(`/rotation/patterns/${id}`);
  return response.data;
};

export const createRotationPattern = async (
  data: Partial<RotationPattern> & { steps: RotationPatternStep[] }
): Promise<RotationPattern> => {
  const response = await api.post("/rotation/patterns", data);
  return response.data;
};

export const updateRotationPattern = async (
  id: number,
  data: Partial<RotationPattern> & { steps: RotationPatternStep[] }
): Promise<RotationPattern> => {
  const response = await api.put(`/rotation/patterns/${id}`, data);
  return response.data;
};

export const deleteRotationPattern = async (id: number): Promise<RotationPattern> => {
  const response = await api.delete(`/rotation/patterns/${id}`);
  return response.data;
};

// === GROUP-PATTERN ASSIGNMENTS ===

export const getRotationAssignments = async (): Promise<GroupAssignment[]> => {
  const response = await api.get("/rotation/assignments");
  return response.data;
};

export const createRotationAssignment = async (
  data: Partial<GroupAssignment>
): Promise<GroupAssignment> => {
  const response = await api.post("/rotation/assignments", data);
  return response.data;
};

export const deleteRotationAssignment = async (id: number): Promise<GroupAssignment> => {
  const response = await api.delete(`/rotation/assignments/${id}`);
  return response.data;
};

// === EMPLOYEES (for selectors) ===

export interface SimpleEmployee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  department: string;
  status: string;
}

export const searchEmployees = async (
  search: string = "",
  limit: number = 50
): Promise<SimpleEmployee[]> => {
  const response = await api.get("/employees", {
    params: { page: 1, limit, search, status: "ACTIVE" },
  });
  return response.data?.data || response.data?.employees || response.data || [];
};
