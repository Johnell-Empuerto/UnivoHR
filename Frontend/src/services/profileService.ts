import api from "./api";

export type Profile = {
  id: number;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  suffix: string | null;
  employee_code: string;
  department: string | null;
  position: string | null;
  birthday: string | null;
  gender: string | null;
  contact_number: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  emergency_contact_address: string | null;
  emergency_contact_relation: string | null;
  marital_status: string | null;
  rfid_tag: string | null;
  fingerprint_id: string | null;
  status: string;
  sss_number: string | null;
  philhealth_number: string | null;
  hdmf_number: string | null;
  tin_number: string | null;
  hired_date: string | null;
  resignation_date: string | null;
  termination_date: string | null;
  last_working_date: string | null;
  created_at: string;
  username: string;
  email: string | null;
  role: string;
  age: number | null;
  full_name: string;
};

export const getProfile = async (): Promise<Profile> => {
  const response = await api.get("/profile");
  return response.data;
};

export const updateProfile = async (data: Partial<Profile>): Promise<any> => {
  const response = await api.put("/profile", data);
  return response.data;
};
