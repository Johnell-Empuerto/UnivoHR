import api from "./api";

//  GET ALL (with optional range and branch filter)
export const getCalendar = async (start?: string, end?: string, branch_id?: string) => {
  const params: any = {};
  if (start) params.start = start;
  if (end) params.end = end;
  if (branch_id) params.branch_id = branch_id;

  const res = await api.get("/calendar", { params });
  return res.data;
};

//  GET ONE BY DATE
export const getCalendarByDate = async (date: string) => {
  const res = await api.get(`/calendar/${date}`);
  return res.data;
};

//  CREATE
export const createCalendarDay = async (data: any) => {
  const res = await api.post("/calendar", data);
  return res.data;
};

//  UPDATE
export const updateCalendarDay = async (id: number, data: any) => {
  const res = await api.put(`/calendar/${id}`, data);
  return res.data;
};

//  DELETE
export const deleteCalendarDay = async (id: number) => {
  const res = await api.delete(`/calendar/${id}`);
  return res.data;
};

//  BULK UPLOAD
export const bulkUploadCalendar = async (
  data: any[],
  overwrite: boolean = true,
) => {
  const res = await api.post("/calendar/bulk", {
    data,
    overwrite,
  });

  return res.data;
};
