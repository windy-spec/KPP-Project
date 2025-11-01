import axios, { type AxiosInstance } from "axios";
import { toast } from "react-hot-toast";

type LogoutAction = () => Promise<void>;
let globalLogoutAction: LogoutAction | null = null;
let logoutReady = false;
let appInitTime = Date.now(); // Thời điểm ứng dụng khởi tạo
let isHandling401 = false; // 🚨 BIẾN CỜ MỚI: Chặn xử lý 401 đa luồng

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
    // 🚨 RESET CỜ SAU KHI LOGOUT THÀNH CÔNG
    isHandling401 = false;
    await globalLogoutAction();
  } else {
    console.warn(" Interceptor chưa sẵn sàng, bỏ qua logout lần này.");
    isHandling401 = false;
  }
};

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // SỬA LỖI LOG CẢNH BÁO
    const now = Date.now();
    const isInitialLoad = now - appInitTime < 1000; // Giả định 1s là thời gian tải ban đầu
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (!isInitialLoad) {
        console.log(" Gửi request với token:", token.slice(0, 30) + "...");
      }
    } else {
      if (!isInitialLoad) {
        console.warn(" Không có token trong localStorage khi gửi request.");
      }
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
          // 🚨 KIỂM TRA BIẾN CỜ
          if (isHandling401) {
            console.warn(" 401 đang được xử lý, bỏ qua request này.");
            return Promise.reject(error);
          }
          isHandling401 = true; // Kích hoạt cờ

          const now = Date.now();
          const appAge = now - appInitTime; // Logic tạm hoãn khi app mới load (dưới 2s)
          if (appAge < 2000) {
            console.log(" App mới load, tạm hoãn xử lý 401 trong 2s..."); // Tạm thời tắt cờ để cho phép xử lý lại sau khi hết thời gian chờ
            // Tuy nhiên, để tránh race condition, ta vẫn giữ cờ và cho setTimeout xử lý
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
      // Trường hợp 403 Forbidden cũng có thể cần xử lý như 401 tùy logic backend
      if (status === 403 && token) {
        console.error("403: Quyền truy cập bị từ chối.");
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
