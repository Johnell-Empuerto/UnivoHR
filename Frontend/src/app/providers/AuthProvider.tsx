import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { setOnTokenRefreshed, clearSessionExpiredFlag } from "@/services/api";
import { logoutAPI } from "@/services/authService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type User = {
  id: number;
  username: string;
  role: string;
  employee_id: number;
  name?: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  employee_code?: string;
  employment_status?: string;
};

type LoginData = {
  token: string;
  refreshToken?: string;
  user?: {
    permissions?: string[];
  };
};

type AuthContextType = {
  isAuth: boolean;
  user: User | null;
  permissions: string[];
  login: (data: LoginData) => void;
  logout: () => void;
  hasPermission: (key: string) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

const PERMISSIONS_KEY = "user_permissions";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const [isAuth, setIsAuth] = useState(!!token);
  const [user, setUser] = useState<User | null>(() => {
    if (!token) return null;
    try {
      return jwtDecode<User>(token);
    } catch {
      return null;
    }
  });
  const [permissions, setPermissions] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(PERMISSIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const hasPermission = useCallback(
    (key: string) => {
      if (user?.role === "ADMIN") return true;
      return permissions.includes(key);
    },
    [user?.role, permissions],
  );

  const login = (data: LoginData) => {
    localStorage.setItem("token", data.token);
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
    const decoded = jwtDecode<User>(data.token);
    setUser(decoded);

    const perms = data.user?.permissions || [];
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms));
    setPermissions(perms);

    setIsAuth(true);
  };

  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const sessionExpiredRef = useRef(false);

  const logout = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (storedRefreshToken) {
      try {
        await logoutAPI(storedRefreshToken);
      } catch {
        // Best-effort — proceed even if API fails
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem(PERMISSIONS_KEY);
    setUser(null);
    setPermissions([]);
    setIsAuth(false);
  }, []);

  const handleSessionExpiredOk = useCallback(() => {
    setShowSessionExpired(false);
    sessionExpiredRef.current = false;
    clearSessionExpiredFlag();
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem(PERMISSIONS_KEY);
    setUser(null);
    setPermissions([]);
    setIsAuth(false);
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    setOnTokenRefreshed((newToken: string, newRefreshToken: string) => {
      localStorage.setItem("token", newToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      const decoded = jwtDecode<User>(newToken);
      setUser(decoded);
    });
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      if (sessionExpiredRef.current) return;
      sessionExpiredRef.current = true;
      setShowSessionExpired(true);
    };
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  // Keep old event as fallback
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      setIsAuth(false);
    };
    window.addEventListener("auth:force-logout", handleForceLogout);
    return () => window.removeEventListener("auth:force-logout", handleForceLogout);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuth, user, permissions, login, logout, hasPermission }}>
      {children}

      <Dialog open={showSessionExpired} onOpenChange={() => {}}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Session Expired</DialogTitle>
            <DialogDescription>
              Your session has expired. Please login again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSessionExpiredOk}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
