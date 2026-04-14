import api from "./api";

export interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

export interface ToggleResponse {
  key: string;
  value: boolean;
}

// Get all settings
export const getAllSettings = async (): Promise<Setting[]> => {
  const response = await api.get("/settings");
  return response.data;
};

// Get single setting
export const getSetting = async (
  key: string,
): Promise<{ key: string; value: string }> => {
  const response = await api.get(`/settings/${key}`);
  return response.data;
};

// Update setting
export const updateSetting = async (
  key: string,
  value: string,
): Promise<Setting> => {
  const response = await api.put(`/settings/${key}`, { value });
  return response.data;
};

// Toggle boolean setting
export const toggleSetting = async (key: string): Promise<ToggleResponse> => {
  const response = await api.post(`/settings/${key}/toggle`);
  return response.data;
};
