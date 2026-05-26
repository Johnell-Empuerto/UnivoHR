import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { setOnTokenRefreshed } from "@/services/api";
import { logoutAPI } from "@/services/authService";

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
};

type LoginData = {
  token: string;
  refreshToken?: string;
};

type AuthContextType = {
  isAuth: boolean;
  user: User | null;
  login: (data: LoginData) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: any) => {
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

  const login = (data: LoginData) => {
    localStorage.setItem("token", data.token);
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
    const decoded = jwtDecode<User>(data.token);
    setUser(decoded);
    setIsAuth(true);
  };

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
    setUser(null);
    setIsAuth(false);
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
    const handleForceLogout = () => {
      setUser(null);
      setIsAuth(false);
    };
    window.addEventListener("auth:force-logout", handleForceLogout);
    return () => window.removeEventListener("auth:force-logout", handleForceLogout);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuth, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
