// services/userService.ts
import api from "./api";

export type User = {
  id: number;
  username: string;
  role: string;
  employee_id: number;
  created_at: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  suffix?: string;
  employee_code?: string;
  department?: string;
  position?: string;
};

export type EmployeeWithoutAccount = {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  employee_code: string;
  department: string;
  position: string;
};

export type UsersResponse = {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// GET USERS with pagination
export const getUsers = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  role: string = "",
): Promise<UsersResponse> => {
  const response = await api.get("/users", {
    params: { page, limit, search, role },
  });
  return response.data;
};

// GET USER BY ID
export const getUserById = async (id: number): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// CREATE USER
export const createUser = async (data: {
  username: string;
  password: string;
  role: string;
  employee_id: number;
}): Promise<User> => {
  const response = await api.post("/users", data);
  return response.data;
};

// UPDATE USER
export const updateUser = async (
  id: number,
  data: {
    username: string;
    password?: string;
    role: string;
  },
): Promise<User> => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

// DELETE USER
export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/users/${id}`);
};

// GET EMPLOYEES WITHOUT ACCOUNTS
export const getEmployeesWithoutAccounts = async (): Promise<
  EmployeeWithoutAccount[]
> => {
  const response = await api.get("/users/available-employees");
  return response.data;
};

// GET EMPLOYEE NAME BY ID
export const getEmployeeName = async (employeeId: number): Promise<any> => {
  const response = await api.get(`/users/employee/${employeeId}`);
  return response.data;
};
