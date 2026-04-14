import api from "./api";

export interface SmtpSettings {
  id: number;
  host: string;
  port: number;
  encryption: "tls" | "ssl" | "none";
  username: string;
  from_email: string;
  from_name?: string;
  is_active: boolean;
  test_email_sent: boolean;
  last_test_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSmtpData {
  host: string;
  port: number;
  encryption: "tls" | "ssl" | "none";
  username: string;
  password: string;
  from_email: string;
  from_name?: string;
  is_active?: boolean;
}

export interface UpdateSmtpData {
  host?: string;
  port?: number;
  encryption?: "tls" | "ssl" | "none";
  username?: string;
  password?: string;
  from_email?: string;
  from_name?: string;
  is_active?: boolean;
}

// Get active SMTP settings
export const getSmtpSettings = async (): Promise<SmtpSettings | null> => {
  const response = await api.get("/smtp");
  return response.data;
};

// Get all SMTP settings
export const getAllSmtpSettings = async (): Promise<SmtpSettings[]> => {
  const response = await api.get("/smtp/all");
  return response.data;
};

// Create SMTP settings
export const createSmtpSettings = async (
  data: CreateSmtpData,
): Promise<SmtpSettings> => {
  const response = await api.post("/smtp", data);
  return response.data;
};

// Update SMTP settings
export const updateSmtpSettings = async (
  id: number,
  data: UpdateSmtpData,
): Promise<SmtpSettings> => {
  const response = await api.put(`/smtp/${id}`, data);
  return response.data;
};

// Delete SMTP settings
export const deleteSmtpSettings = async (id: number): Promise<void> => {
  await api.delete(`/smtp/${id}`);
};

// Test SMTP connection
export const testSmtpConnection = async (
  id: number,
  testEmail: string,
): Promise<{ message: string }> => {
  const response = await api.post("/smtp/test", { id, test_email: testEmail });
  return response.data;
};
