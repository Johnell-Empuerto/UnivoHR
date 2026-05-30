import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.1.8:3003/api",
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let isSessionExpired = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const triggerSessionExpired = () => {
  if (isSessionExpired) return;
  isSessionExpired = true;
  window.dispatchEvent(new CustomEvent("auth:session-expired"));
};

export const clearSessionExpiredFlag = () => {
  isSessionExpired = false;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      (originalRequest.url && originalRequest.url.startsWith("/auth/"))
    ) {
      return Promise.reject(error);
    }

    if (isSessionExpired) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      triggerSessionExpired();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );

      const { token: newToken, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("refreshToken", newRefreshToken);

      if (typeof onTokenRefreshed === "function") {
        onTokenRefreshed(newToken, newRefreshToken);
      }

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      triggerSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

let onTokenRefreshed: ((token: string, refreshToken: string) => void) | null =
  null;

export const setOnTokenRefreshed = (cb: typeof onTokenRefreshed) => {
  onTokenRefreshed = cb;
};

export default api;
