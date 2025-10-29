import axios, { type AxiosInstance } from "axios";
import { toast } from "react-hot-toast";

type LogoutAction = () => Promise<void>;
let globalLogoutAction: LogoutAction | null = null;
let logoutReady = false;
let appInitTime = Date.now();

export const setGlobalLogoutAction = (action: LogoutAction) => {
  globalLogoutAction = action;
  logoutReady = true;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: "http://localhost:5001/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

const handleLogout = async () => {
  if (globalLogoutAction && logoutReady) {
    console.log(" Logout an toàn được gọi qua Interceptor.");
    await globalLogoutAction();
  } else {
    console.warn(" Interceptor chưa sẵn sàng, bỏ qua logout lần này.");
  }
};

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(" Gửi request với token:", token.slice(0, 30) + "...");
    } else {
      console.warn(" Không có token trong localStorage khi gửi request.");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      if (status === 401) {
        const token = localStorage.getItem("accessToken");

        if (token) {
          const now = Date.now();
          const appAge = now - appInitTime;
          if (appAge < 2000) {
            console.log(" App mới load, tạm hoãn xử lý 401 trong 2s...");
            setTimeout(() => handleLogout(), 1500);
            return Promise.reject(error);
          }

          console.error("401: Token tồn tại nhưng bị từ chối.");
          return handleLogout();
        } else {
          console.warn(" 401 không có token, có thể đăng nhập sai.");
        }
        return Promise.reject(error);
      }

      console.error(`LỖI HTTP KHÁC: ${status}.`);
      return Promise.reject(error);
    } else if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
      console.error("Không thể kết nối đến máy chủ.");
      toast.error("Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
