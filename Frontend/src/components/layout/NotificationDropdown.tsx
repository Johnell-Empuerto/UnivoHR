"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Clock,
  BellRing,
  Calendar,
  Clock as ClockIcon,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { formatDateRange, formatDateShort } from "@/utils/formatDate";
import { useAuth } from "@/app/providers/AuthProvider";
import { isApprover as checkIsApprover } from "@/services/overtimeService";

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isUserApprover, setIsUserApprover] = useState(false);

  // Check if user is an approver
  useEffect(() => {
    const checkApproverStatus = async () => {
      if (user?.id) {
        try {
          const result = await checkIsApprover();
          setIsUserApprover(result.isApprover);
        } catch (error) {
          setIsUserApprover(false);
        }
      }
    };
    checkApproverStatus();
  }, [user?.id]);

  // Smart navigation based on notification type and content
  const getNavigationPath = (notification: Notification) => {
    const isHR = ["ADMIN", "HR_ADMIN", "HR"].includes(user?.role || "");
    const canManage = isHR || isUserApprover;

    switch (notification.type) {
      case "LEAVE":
        // For leave: New Leave Request goes to Manage Leaves, Leave Approved/Rejected goes to My Leaves
        if (notification.title.includes("New") && canManage) {
          return "/leaves"; // Manage Leaves (All Leaves tab)
        }
        return "/leaves"; // My Leaves tab (will show their own)

      case "OVERTIME":
        // New logic: Check what type of overtime notification
        if (notification.title.includes("New") && canManage) {
          // New Overtime Request - needs approval to go to Manage Overtime
          return "/overtime";
        }
        // Overtime Approved or Overtime Declined - their own request to go to My Overtime
        return "/myovertime";

      case "TIME_MODIFICATION":
        // Time modification requests go to Attendance page with time-requests tab
        return "/attendance?tab=time-requests";

      case "PAYROLL":
        return "/payroll";

      default:
        return "/dashboard";
    }
  };

  // Fetch unread count only (lightweight)
  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      // Failed to fetch unread count
    }
  };

  // Fetch notifications (only when dropdown opens)
  const fetchNotifications = async (isLoadMore = false) => {
    if (!user?.id) return;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentPage = isLoadMore ? page : 1;
      const data = await getMyNotifications(currentPage, 5);

      const sortedData = [...data.data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      if (isLoadMore) {
        setNotifications((prev) => [...prev, ...sortedData]);
        setPage(currentPage + 1);
      } else {
        setNotifications(sortedData);
        setPage(2);
      }

      setHasMore(data.pagination.page < data.pagination.totalPages);
      setTotalCount(data.pagination.total);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      // Failed to fetch notifications
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch unread count when user logs in or changes
  useEffect(() => {
    if (user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setPage(1);
      setHasMore(false);
      setTotalCount(0);
      fetchUnreadCount();
      if (open) {
        fetchNotifications(false);
      }
    }
  }, [user?.id]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open && user?.id) {
      fetchNotifications(false);
    }
  }, [open]);

  // Listen for real-time unread count updates from socket
  useEffect(() => {
    const handleUnreadUpdate = (event: CustomEvent) => {
      setUnreadCount(event.detail.count);
      if (open) {
        fetchNotifications(false);
      } else {
        fetchUnreadCount();
      }
    };

    window.addEventListener(
      "unreadCountUpdate",
      handleUnreadUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        "unreadCountUpdate",
        handleUnreadUpdate as EventListener,
      );
    };
  }, [open]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchNotifications(true);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/notifications");
  };

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

    setOpen(false);

    // Use smart navigation
    const path = getNavigationPath(notification);
    navigate(path);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      // Failed to mark all as read
    }
  };

  const formatNotificationMessage = (notification: Notification) => {
    const meta = notification.meta || {};
    if (notification.type === "LEAVE") {
      if (meta.from_date && meta.to_date && meta.leave_type) {
        return `${meta.leave_type}: ${formatDateRange(meta.from_date, meta.to_date)}`;
      }
      if (notification.message && notification.message.length > 60) {
        return notification.message.substring(0, 60) + "...";
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
        return <Calendar className="h-4 w-4" />;
      case "OVERTIME":
        return <ClockIcon className="h-4 w-4" />;
      case "TIME_MODIFICATION":
        return <Clock className="h-4 w-4" />;
      case "PAYROLL":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
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

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea
          className="h-100"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            const isBottom =
              target.scrollHeight - target.scrollTop <=
              target.clientHeight + 50;
            if (isBottom && hasMore && !loadingMore) {
              handleLoadMore();
            }
          }}
        >
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                When you have notifications, they'll show up here
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <DropdownMenuItem
                    className={`flex items-start gap-3 p-4 cursor-pointer ${
                      !notification.is_read ? "bg-muted/30" : ""
                    } hover:bg-muted/50 transition-colors`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className={`shrink-0 p-2 rounded-full ${getTypeColor(notification.type)}`}
                    >
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold truncate">
                          {formatTitle(notification)}
                        </p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {formatNotificationMessage(notification)}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            { addSuffix: true },
                          )}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              )}
            </>
          )}
        </ScrollArea>

        {/* View All Notifications Button */}
        <div className="border-t">
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto text-sm font-medium rounded-none hover:bg-muted"
            onClick={handleViewAll}
          >
            <span>
              View all notifications
              {totalCount > 5 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {totalCount}
                </Badge>
              )}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
