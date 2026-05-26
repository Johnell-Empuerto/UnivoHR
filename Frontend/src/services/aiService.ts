import api from "./api";

export const sendAiMessage = async (question: string, sessionId?: number) => {
  const response = await api.post("/ai/chat", { question, sessionId });
  return response.data;
};

export const getAiSessions = async (params?: { status?: string; page?: number; limit?: number }) => {
  const response = await api.get("/ai/sessions", { params });
  return response.data;
};

export const getAiSessionMessages = async (sessionId: number) => {
  const response = await api.get(`/ai/sessions/${sessionId}/messages`);
  return response.data;
};

export const deleteAiSession = async (sessionId: number) => {
  const response = await api.delete(`/ai/sessions/${sessionId}`);
  return response.data;
};

export const sendAiFeedback = async (messageId: number, rating: number, comment?: string) => {
  const response = await api.post("/ai/feedback", { messageId, rating, comment });
  return response.data;
};
