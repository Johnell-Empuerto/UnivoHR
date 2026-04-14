// services/authService.ts
import api from "./api";

export interface LoginResponse {
  token?: string;
  user?: any;
  requires_2fa: boolean;
  user_id?: number;
  masked_email?: string;
  message?: string;
}

export interface VerifyOTPResponse {
  token: string;
  user: any;
  requires_2fa: boolean;
}

export const login = async (data: {
  username: string;
  password: string;
}): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const verifyOTP = async (data: {
  user_id: number;
  otp: string;
}): Promise<VerifyOTPResponse> => {
  const response = await api.post("/auth/verify-otp", data);
  return response.data;
};

export const resendOTP = async (data: {
  user_id: number;
}): Promise<{ success: boolean; message: string }> => {
  const response = await api.post("/auth/resend-otp", data);
  return response.data;
};
