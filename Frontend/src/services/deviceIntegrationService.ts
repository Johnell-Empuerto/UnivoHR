import api from "./api";

export interface Device {
  id: number;
  name: string;
  type: string;
  serial_number: string | null;
  model: string | null;
  ip_address: string | null;
  port: number | null;
  location: string | null;
  status: string;
  api_key: string | null;
  notes: string | null;
  last_connected_at: string | null;
  created_at: string;
  updated_at: string;
  total_logs?: number;
  pending_logs?: number;
  branch_id: number | null;
  branch_name: string | null;
  branch_timezone: string | null;
}

export interface RawLog {
  id: number;
  device_id: number | null;
  employee_code: string | null;
  timestamp: string;
  raw_payload: string | null;
  status: string;
  error_message: string | null;
  processed_at: string | null;
  import_batch_id: string | null;
  source: string;
  created_at: string;
  device_name?: string;
}

export interface DeviceLogMapping {
  id: number;
  device_id: number;
  field_source: string;
  field_target: string;
  transform_expression: string | null;
  is_active: boolean;
  created_at: string;
  device_name?: string;
}

export interface EmployeeDeviceUser {
  id: number;
  employee_id: number;
  device_id: number;
  device_user_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  device_name?: string;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
}

export interface EmployeeSearchResult {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  department: string | null;
  position: string | null;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// ─── DEVICES ────────────────────────────────────────────────

export const getDevices = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
}): Promise<PaginatedResponse<Device>> => {
  const response = await api.get("/device-integration/devices", { params });
  return response.data;
};

export const getDevice = async (id: number): Promise<Device> => {
  const response = await api.get(`/device-integration/devices/${id}`);
  return response.data;
};

export const createDevice = async (data: Partial<Device>): Promise<Device> => {
  const response = await api.post("/device-integration/devices", data);
  return response.data;
};

export const updateDevice = async (id: number, data: Partial<Device>): Promise<Device> => {
  const response = await api.put(`/device-integration/devices/${id}`, data);
  return response.data;
};

export const deleteDevice = async (id: number): Promise<void> => {
  await api.delete(`/device-integration/devices/${id}`);
};

// ─── EMPLOYEE SEARCH ─────────────────────────────────────────

export const searchEmployees = async (params: {
  search?: string;
  employee_code?: string;
  employee_name?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<EmployeeSearchResult>> => {
  const response = await api.get("/employees/search", { params });
  return response.data;
};

// ─── RAW LOGS ────────────────────────────────────────────────

export const getRawLogs = async (params?: {
  page?: number;
  limit?: number;
  device_id?: number;
  status?: string;
  source?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}): Promise<PaginatedResponse<RawLog>> => {
  const response = await api.get("/device-integration/logs", { params });
  return response.data;
};

// ─── IMPORT ─────────────────────────────────────────────────

export const importLogs = async (file: File, deviceId?: number): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);
  if (deviceId) formData.append("device_id", String(deviceId));
  const response = await api.post("/device-integration/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// ─── MAPPINGS ────────────────────────────────────────────────

export const getMappings = async (deviceId?: number): Promise<DeviceLogMapping[]> => {
  const response = await api.get("/device-integration/mappings", {
    params: deviceId ? { device_id: deviceId } : {},
  });
  return response.data;
};

export const createMapping = async (data: Partial<DeviceLogMapping>): Promise<DeviceLogMapping> => {
  const response = await api.post("/device-integration/mappings", data);
  return response.data;
};

export const updateMapping = async (id: number, data: Partial<DeviceLogMapping>): Promise<DeviceLogMapping> => {
  const response = await api.put(`/device-integration/mappings/${id}`, data);
  return response.data;
};

export const deleteMapping = async (id: number): Promise<void> => {
  await api.delete(`/device-integration/mappings/${id}`);
};

// ─── EMPLOYEE DEVICE USERS ────────────────────────────────

export const getEmployeeDeviceUsers = async (params?: {
  page?: number;
  limit?: number;
  device_id?: number;
  active?: string;
}): Promise<PaginatedResponse<EmployeeDeviceUser>> => {
  const response = await api.get("/device-integration/device-users", { params });
  return response.data;
};

export const createEmployeeDeviceUser = async (data: {
  employee_id: number;
  device_id: number;
  device_user_id: string;
}): Promise<EmployeeDeviceUser> => {
  const response = await api.post("/device-integration/device-users", data);
  return response.data;
};

export const updateEmployeeDeviceUser = async (id: number, data: Partial<EmployeeDeviceUser>): Promise<EmployeeDeviceUser> => {
  const response = await api.put(`/device-integration/device-users/${id}`, data);
  return response.data;
};

export const deleteEmployeeDeviceUser = async (id: number): Promise<void> => {
  await api.delete(`/device-integration/device-users/${id}`);
};

// ─── RAW LOG ──────────────────────────────────────────────

export const getRawLogById = async (id: number): Promise<RawLog> => {
  const response = await api.get(`/device-integration/logs/${id}`);
  return response.data;
};

// ─── GENERIC PUSH ───────────────────────────────────────────

export const pushDeviceLog = async (deviceId: number, payload: Record<string, any>): Promise<any> => {
  const response = await api.post(`/device-integration/push/${deviceId}`, payload);
  return response.data;
};
