import api from "./api";

export interface PermissionGroup {
  [module: string]: string[];
}

export interface AllPermissionsResponse {
  allPermissions: string[];
  groups: PermissionGroup;
}

export interface UserPermissionsResponse {
  userId: number;
  permissions: string[];
}

export const getAllPermissions = async (): Promise<AllPermissionsResponse> => {
  const response = await api.get("/permissions");
  return response.data;
};

export const getUserPermissions = async (userId: number): Promise<UserPermissionsResponse> => {
  const response = await api.get(`/permissions/${userId}`);
  return response.data;
};

export const setUserPermissions = async (userId: number, permissions: string[]): Promise<void> => {
  await api.put(`/permissions/${userId}`, { permissions });
};

export const resetUserPermissions = async (userId: number): Promise<void> => {
  await api.post(`/permissions/${userId}/reset`);
};
