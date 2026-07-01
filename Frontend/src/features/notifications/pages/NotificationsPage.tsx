import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { TablePagination } from "@/components/shared/TablePagination";
import {
  Bell,
  CheckCheck,
  Clock,
  Calendar,
  Clock as ClockIcon,
  DollarSign,
  ClipboardList,
  BarChart3,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { formatDateRange, formatDateShort } from "@/utils/formatDate";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: notifResponse, isFetching } = useNotifications(page, pageSize, user?.id);
  const rawNotifications = notifResponse?.data ?? [];
  const notifications = useMemo(
    () => [...rawNotifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [rawNotifications],
  );
  const totalPages = notifResponse?.pagination?.totalPages ?? 1;
  const totalCount = notifResponse?.pagination?.total ?? 0;
  const unreadCount = notifResponse?.unreadCount ?? 0;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      queryClient.setQueryData(["notifications", page, pageSize, user?.id], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((n: Notification) =>
            n.id === notification.id ? { ...n, is_read: true } : n,
          ),
          unreadCount: Math.max(0, (old.unreadCount ?? 0) - 1),
        };
      });
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
        if (
          notification.title.includes("Available") ||
          notification.title.includes("Payslip") ||
          notification.title.includes("Paid")
        ) {
          navigate("/my-payroll");
        } else {
          navigate("/payroll");
        }
        break;
      case "MAN_HOUR":
        if (notification.title.includes("New")) {
          navigate("/manhours-approval");
        } else {
          navigate("/my-manhours");
        }
        break;
      case "HR_FORM":
        if (
          notification.title.includes("Submitted") ||
          notification.title.includes("New")
        ) {
          navigate("/hr-forms/assignments");
        } else {
          navigate("/hr-forms/my-assignments");
        }
        break;
      case "KPI_EVALUATION":
        if (notification.title === "Evaluation Submitted") {
          navigate("/kpi/evaluations");
        } else if (
          !notification.meta?.employee_id ||
          Number(user?.employee_id) === Number(notification.meta.employee_id)
        ) {
          navigate("/kpi/self-evaluation");
        } else {
          navigate("/kpi/my-evaluations");
        }
        break;
      case "RECRUITMENT":
        navigate("/recruitment/applicants");
        break;
      default:
        break;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      queryClient.setQueryData(["notifications", page, pageSize, user?.id], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((n: Notification) => ({ ...n, is_read: true })),
          unreadCount: 0,
        };
      });
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
    if (notification.type === "HR_FORM") {
      if (meta.form_title) return meta.form_title;
      return notification.message || "HR Form update";
    }
    if (notification.type === "KPI_EVALUATION") {
      return notification.message || "Performance evaluation update";
    }
    if (notification.type === "RECRUITMENT") {
      return notification.message || "Recruitment update";
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
    if (notification.type === "HR_FORM") {
      if (notification.title.includes("New")) return "Form Assigned";
      if (notification.title.includes("Submitted")) return "Form Submitted";
      if (notification.title.includes("Reviewed")) return "Form Reviewed";
      return "HR Form Update";
    }
    if (notification.type === "KPI_EVALUATION") {
      if (notification.title.includes("Assigned")) return "Evaluation Assigned";
      if (notification.title.includes("Submitted"))
        return "Evaluation Submitted";
      if (notification.title.includes("Approved")) return "Evaluation Approved";
      if (notification.title.includes("Returned")) return "Evaluation Returned";
      return "Performance Update";
    }
    if (notification.type === "RECRUITMENT") {
      if (notification.title.includes("New")) return "New Applicant";
      if (notification.title.includes("Interview"))
        return "Interview Scheduled";
      if (notification.title.includes("Approval")) return "Approval";
      if (notification.title.includes("Hired")) return "Applicant Hired";
      if (notification.title.includes("Updated")) return "Status Updated";
      return "Recruitment Update";
    }
    return notification.title.replace(/[💰📋⏰]/g, "").trim();
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
      case "HR_FORM":
        return <ClipboardList className="h-5 w-5" />;
      case "KPI_EVALUATION":
        return <BarChart3 className="h-5 w-5" />;
      case "RECRUITMENT":
        return <UserPlus className="h-5 w-5" />;
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
      case "HR_FORM":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      case "KPI_EVALUATION":
        return "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400";
      case "RECRUITMENT":
        return "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  if (isFetching && notifications.length === 0) {
    return <Loader fullPage />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-muted-foreground">
              Notifications
            </h1>
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
            <EmptyState
              icon={<Bell className="h-6 w-6" />}
              message="No notifications"
              description="You're all caught up! New notifications will appear here."
            />
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
              {totalCount > 0 && (
                <TablePagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  pageSize={pageSize}
                  onPageChange={(p) => setPage(p)}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
