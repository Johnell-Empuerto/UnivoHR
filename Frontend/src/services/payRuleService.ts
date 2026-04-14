import api from "./api";

// ==============================
// PAY RULES (ADMIN)
// ==============================

// Get all pay rules
export const getPayRules = async () => {
  const res = await api.get("/pay-rules/pay-rules");
  return res.data;
};

// Get single pay rule
export const getPayRuleById = async (id: number) => {
  const res = await api.get(`/pay-rules/pay-rules/${id}`);
  return res.data;
};

// Create pay rule
export const createPayRule = async (data: {
  day_type: string;
  multiplier: number;
}) => {
  const res = await api.post("/pay-rules/pay-rules", data);
  return res.data;
};

// Update pay rule
export const updatePayRule = async (
  id: number,
  data: {
    day_type: string;
    multiplier: number;
  },
) => {
  const res = await api.put(`/pay-rules/pay-rules/${id}`, data);
  return res.data;
};

// Delete pay rule
export const deletePayRule = async (id: number) => {
  const res = await api.delete(`/pay-rules/pay-rules/${id}`);
  return res.data;
};

// ==============================
// CALENDAR DAYS (ADMIN)
// ==============================

// Get calendar days (range)
export const getCalendarDays = async (start_date: string, end_date: string) => {
  const res = await api.get("/pay-rules/calendar-days", {
    params: { start_date, end_date },
  });
  return res.data;
};

// Create or update (UPSERT) calendar day
export const upsertCalendarDay = async (data: {
  date: string;
  day_type: string;
  notes?: string;
}) => {
  const res = await api.post("/pay-rules/calendar-days", data);
  return res.data;
};

// Delete calendar day
export const deleteCalendarDay = async (date: string) => {
  const res = await api.delete(`/pay-rules/calendar-days/${date}`);
  return res.data;
};
