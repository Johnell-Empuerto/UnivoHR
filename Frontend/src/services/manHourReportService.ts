import api from "./api";

// MAN HOUR REPORT - EMPLOYEE

// GET MY MAN HOUR REPORTS
export const getMyManHourReports = async (
  page: number,
  limit: number,
  search: string = "",
  status: string = "",
) => {
  const response = await api.get("/man-hour-reports/my", {
    params: {
      page,
      limit,
      search,
      status,
    },
  });
  return response.data;
};

// CREATE MAN HOUR REPORT
export const createManHourReport = async (data: {
  work_date: string;
  task: string;
  hours: number;
  remarks?: string;
}) => {
  const response = await api.post("/man-hour-reports", data);
  return response.data;
};

// UPDATE MAN HOUR REPORT
export const updateManHourReport = async (
  id: number,
  data: {
    task?: string;
    hours?: number;
    remarks?: string;
  },
) => {
  const response = await api.put(`/man-hour-reports/${id}`, data);
  return response.data;
};

// DELETE MAN HOUR REPORT
export const deleteManHourReport = async (id: number) => {
  const response = await api.delete(`/man-hour-reports/${id}`);
  return response.data;
};

// MAN HOUR REPORT - ADMIN/HR

// GET ALL MAN HOUR REPORTS (for approval)
export const getAllManHourReports = async (
  page: number,
  limit: number,
  search: string = "",
  date: string = "",
) => {
  const response = await api.get("/man-hour-reports", {
    params: {
      page,
      limit,
      search,
      date,
    },
  });
  return response.data;
};

// APPROVE MAN HOUR REPORT
export const approveManHourReport = async (
  id: number,
  data: { comment?: string } = {},
) => {
  const response = await api.put(`/man-hour-reports/${id}/approve`, data);
  return response.data;
};

// REJECT MAN HOUR REPORT
export const rejectManHourReport = async (
  id: number,
  data: { reason: string },
) => {
  const response = await api.put(`/man-hour-reports/${id}/reject`, data);
  return response.data;
};

// GET MAN HOUR REPORT DETAILS (with approval timeline)
export const getManHourReportDetails = async (id: number) => {
  const response = await api.get(`/man-hour-reports/${id}`);
  return response.data;
};

// GET MAN HOUR SUMMARY FOR DATE RANGE
export const getManHourSummary = async (
  start_date: string,
  end_date: string,
  employee_id?: string,
) => {
  const response = await api.get("/man-hour-reports/summary/range", {
    params: {
      start_date,
      end_date,
      employee_id,
    },
  });
  return response.data;
};

// CHECK IF USER IS APPROVER
export const isApprover = async () => {
  const response = await api.get("/man-hour-reports/is-approver");
  return response.data;
};
