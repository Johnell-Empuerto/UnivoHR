import api from "./api";

export type Notification = {
  id: number;
  user_id: number;
  type: "LEAVE" | "OVERTIME" | "PAYROLL" | "TIME_MODIFICATION" | "MAN_HOUR";
  title: string;
  message: string;
  reference_id: number | null;
  meta: any;
  is_read: boolean;
  created_at: string;
};

export type NotificationsResponse = {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
};

// Get my notifications with pagination
export const getMyNotifications = async (
  page = 1,
  limit = 20,
): Promise<NotificationsResponse> => {
  const response = await api.get("/notifications", {
    params: { page, limit },
  });
  return response.data;
};

// Mark notification as read
export const markNotificationAsRead = async (id: number): Promise<void> => {
  await api.put(`/notifications/${id}/read`);
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.put("/notifications/read-all");
};

// Get unread count only (lighter API call)
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get("/notifications/unread-count");
  return response.data.unreadCount;
};
