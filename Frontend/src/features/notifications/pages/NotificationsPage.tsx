import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Clock,
  Calendar,
  Clock as ClockIcon,
  DollarSign,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { formatDateRange, formatDateShort } from "@/utils/formatDate";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const data = await getMyNotifications(currentPage, 20);

      const sortedData = [...data.data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      if (reset) {
        setNotifications(sortedData);
        setPage(2);
      } else {
        const existingIds = new Set(notifications.map((n) => n.id));
        const newNotifications = sortedData.filter(
          (n) => !existingIds.has(n.id),
        );
        setNotifications((prev) => [...prev, ...newNotifications]);
        setPage(currentPage + 1);
      }

      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n,
        ),
      );
    }

    switch (notification.type) {
      case "LEAVE":
        navigate("/leaves");
        break;
      case "OVERTIME":
        navigate("/myovertime");
        break;
      case "TIME_MODIFICATION":
        navigate("/attendance?tab=time-requests");
        break;
      case "PAYROLL":
        navigate("/payroll");
        break;
      default:
        break;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const formatNotificationMessage = (notification: Notification) => {
    const meta = notification.meta || {};
    if (notification.type === "LEAVE") {
      if (meta.from_date && meta.to_date && meta.leave_type) {
        return `${meta.leave_type}: ${formatDateRange(meta.from_date, meta.to_date)}`;
      }
      if (notification.message && notification.message.length > 80) {
        return notification.message.substring(0, 80) + "...";
      }
      return notification.message || "Leave update";
    }
    if (notification.type === "OVERTIME") {
      if (meta.date && meta.hours) {
        return `${formatDateShort(meta.date)} (${meta.hours} hrs)`;
      }
      return notification.message || "Overtime update";
    }
    if (notification.type === "TIME_MODIFICATION") {
      if (meta.attendance_date) {
        return `Time modification for ${formatDateShort(meta.attendance_date)}`;
      }
      return notification.message || "Time modification update";
    }
    if (notification.type === "PAYROLL") {
      return "Salary has been released";
    }
    return notification.message;
  };

  const formatTitle = (notification: Notification) => {
    if (notification.type === "LEAVE") {
      if (notification.title.includes("Approved")) return "Leave Approved";
      if (notification.title.includes("Rejected")) return "Leave Declined";
      if (notification.title.includes("New")) return "Leave Request";
      return "Leave Update";
    }
    if (notification.type === "OVERTIME") {
      if (notification.title.includes("Approved")) return "Overtime Approved";
      if (notification.title.includes("Rejected")) return "Overtime Declined";
      if (notification.title.includes("New")) return "Overtime Request";
      return "Overtime Update";
    }
    if (notification.type === "TIME_MODIFICATION") {
      if (notification.title.includes("New"))
        return "Time Modification Request";
      if (notification.title.includes("Approved"))
        return "Time Modification Approved";
      if (notification.title.includes("Rejected"))
        return "Time Modification Declined";
      return "Time Modification Update";
    }
    if (notification.type === "PAYROLL") {
      return "Salary Released";
    }
    return notification.title.replace(/[✅❌💰📋⏰]/g, "").trim();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "LEAVE":
        return <Calendar className="h-5 w-5" />;
      case "OVERTIME":
        return <ClockIcon className="h-5 w-5" />;
      case "TIME_MODIFICATION":
        return <Clock className="h-5 w-5" />;
      case "PAYROLL":
        return <DollarSign className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "LEAVE":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "OVERTIME":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
      case "TIME_MODIFICATION":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400";
      case "PAYROLL":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Stay updated with your latest activities
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            All Notifications
            {totalCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalCount} total
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                      !notification.is_read
                        ? "bg-muted/50 hover:bg-muted"
                        : "hover:bg-muted/30"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className={`shrink-0 p-2 rounded-full ${getTypeColor(notification.type)}`}
                    >
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {formatTitle(notification)}
                        </p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatNotificationMessage(notification)}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(notification.created_at),
                              { addSuffix: true },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
              {page <= totalPages && (
                <div className="flex justify-center pt-6">
                  <Button
                    variant="outline"
                    onClick={() => fetchNotifications()}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )}
              {page > totalPages && totalCount > 20 && (
                <div className="text-center pt-4 text-xs text-muted-foreground">
                  You've reached the end
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
