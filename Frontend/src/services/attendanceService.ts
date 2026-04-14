import api from "./api";

// ATTENDANCE

export const attendance = async (
  page: number,
  limit: number,
  search: string = "",
  status: string = "",
  date: string = "",
) => {
  const response = await api.get("/attendance", {
    params: {
      page,
      limit,
      search,
      status,
      date,
    },
  });

  return response.data;
};

// ATTENDANCE RULES (CRUD)

//  GET ALL RULES (table view)
export const getAttendanceRules = async () => {
  const res = await api.get("/attendance-rules");
  return res.data;
};

//  GET ACTIVE RULE (optional)
export const getActiveRule = async () => {
  const res = await api.get("/attendance-rules/active");
  return res.data;
};

//  CREATE RULE
export const createAttendanceRule = async (data: any) => {
  const res = await api.post("/attendance-rules", data);
  return res.data;
};

//  ACTIVATE RULE
export const activateAttendanceRule = async (id: number) => {
  const res = await api.put(`/attendance-rules/${id}/activate`);
  return res.data;
};

//  DELETE RULE
export const deleteAttendanceRule = async (id: number) => {
  const res = await api.delete(`/attendance-rules/${id}`);
  return res.data;
};

export const updateAttendanceRule = async (id: number, data: any) => {
  const res = await api.put(`/attendance-rules/${id}`, data);
  return res.data;
};

// TIME MODIFICATION REQUESTS

// Create a new time modification request
export const createTimeModificationRequest = async (data: {
  attendance_id: number;
  requested_check_in: string;
  requested_check_out: string;
  reason: string;
}) => {
  const res = await api.post("/attendance/time-requests", data);
  return res.data;
};

// Get my time modification requests
export const getMyTimeModificationRequests = async (
  page: number,
  limit: number,
) => {
  const res = await api.get("/attendance/time-requests/my", {
    params: { page, limit },
  });
  return res.data;
};

// Get all time modification requests (admin/HR view)
export const getAllTimeModificationRequests = async (
  page: number,
  limit: number,
) => {
  const res = await api.get("/attendance/time-requests", {
    params: { page, limit },
  });
  return res.data;
};

// Update time modification request status (approve/reject)
export const updateTimeModificationStatus = async (
  id: number,
  data: {
    status: "APPROVED" | "REJECTED";
    rejection_reason?: string;
  },
) => {
  const res = await api.put(`/attendance/time-requests/${id}/status`, data);
  return res.data;
};
