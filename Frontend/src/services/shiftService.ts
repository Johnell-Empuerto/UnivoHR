import api from "./api";

export interface Shift {
  id: number;
  name: string;
  code: string | null;
  type: "MORNING" | "MID" | "NIGHT" | "FLEXITIME";
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  grace_minutes: number;
  required_hours: number;
  flex_start_window: string | null;
  flex_end_window: string | null;
  is_night_shift: boolean;
  is_flexitime: boolean;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ShiftAssignment {
  id: number;
  employee_id: number;
  shift_id: number;
  effective_date: string;
  end_date: string | null;
  shift_name?: string;
  shift_type?: string;
  shift_code?: string;
  start_time?: string;
  end_time?: string;
  created_at?: string;
  updated_at?: string;
}

export const getShifts = async (): Promise<Shift[]> => {
  const response = await api.get("/shifts");
  return response.data;
};

export const getShift = async (id: number): Promise<Shift> => {
  const response = await api.get(`/shifts/${id}`);
  return response.data;
};

export const createShift = async (
  data: Omit<Shift, "id" | "created_at" | "updated_at">
): Promise<Shift> => {
  const response = await api.post("/shifts", data);
  return response.data;
};

export const updateShift = async (
  id: number,
  data: Partial<Omit<Shift, "id" | "created_at" | "updated_at">>
): Promise<Shift> => {
  const response = await api.put(`/shifts/${id}`, data);
  return response.data;
};

export const deleteShift = async (id: number): Promise<Shift> => {
  const response = await api.delete(`/shifts/${id}`);
  return response.data;
};

export const getActiveShifts = async (): Promise<Shift[]> => {
  const response = await api.get("/shifts/active");
  return response.data;
};

export const assignShift = async (
  employeeId: number,
  shiftId: number,
  effectiveDate: string,
  endDate?: string | null
): Promise<ShiftAssignment> => {
  const response = await api.post("/shifts/assign", {
    employee_id: employeeId,
    shift_id: shiftId,
    effective_date: effectiveDate,
    end_date: endDate || null,
  });
  return response.data;
};

export const getAssignments = async (
  employeeId: number
): Promise<ShiftAssignment[]> => {
  const response = await api.get(`/shifts/assignments/${employeeId}`);
  return response.data;
};
