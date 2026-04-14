// app/providers/SocketProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";

type Notification = {
  id: number;
  type: "LEAVE" | "OVERTIME" | "PAYROLL";
  title: string;
  message: string;
  reference_id: number;
  created_at: string;
};

type SocketContextType = {
  socket: Socket | null;
  lastNotification: Notification | null;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  lastNotification: null,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuth } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastNotification, setLastNotification] = useState<Notification | null>(
    null,
  );

  useEffect(() => {
    if (!isAuth || !user?.id) return;

    const socketInstance = io(
      import.meta.env.VITE_API_URL || "http://localhost:3002",
      {
        withCredentials: true,
      },
    );

    socketInstance.on("connect", () => {
      socketInstance.emit("join", user.id);
    });

    socketInstance.on("notification", (notification: Notification) => {
      setLastNotification(notification);

      // Show toast notification
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
        action: {
          label: "View",
          onClick: () => {
            // Handle navigation based on type
            if (notification.type === "LEAVE") {
              window.location.href = `/leaves`;
            } else if (notification.type === "OVERTIME") {
              window.location.href = `/myovertime`;
            } else if (notification.type === "PAYROLL") {
              window.location.href = `/payroll`;
            }
          },
        },
      });
    });

    socketInstance.on("unread_count", (count: number) => {
      // Update badge in navbar
      window.dispatchEvent(
        new CustomEvent("unreadCountUpdate", { detail: { count } }),
      );
    });

    socketInstance.on("disconnect", () => {
      // Socket disconnected
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuth, user?.id]);

  return (
    <SocketContext.Provider value={{ socket, lastNotification }}>
      {children}
    </SocketContext.Provider>
  );
};
