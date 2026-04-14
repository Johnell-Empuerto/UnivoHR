import { createContext, useContext, useState } from "react";
import { jwtDecode } from "jwt-decode";

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

type AuthContextType = {
  isAuth: boolean;
  user: User | null;
  login: (data: { token: string }) => void;
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

  const login = (data: { token: string }) => {
    localStorage.setItem("token", data.token);

    const decoded = jwtDecode<User>(data.token);
    setUser(decoded);

    console.log("USER AFTER LOGIN:", decoded);

    setIsAuth(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuth(false);
  };

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
