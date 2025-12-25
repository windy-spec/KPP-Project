import axios, { type AxiosInstance } from "axios";
import { toast } from "react-hot-toast";

type LogoutAction = () => Promise<void>;
let globalLogoutAction: LogoutAction | null = null;
let logoutReady = false;
let appInitTime = Date.now();
let isHandling401 = false;

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
    console.log("Logout an toàn được gọi qua Interceptor.");
    isHandling401 = false;
    await globalLogoutAction();
  } else {
    console.warn("Interceptor chưa sẵn sàng, bỏ qua logout.");
    isHandling401 = false;
  }
};

// 1. Interceptor cho Request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Interceptor cho Response (GỘP CHUẨN)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // ✅ Khai báo token ở đầu để tất cả logic bên dưới đều dùng được
    const token = localStorage.getItem("accessToken");

    if (axios.isAxiosError(error)) {
      // Trường hợp 1: Có phản hồi từ server (401, 403, v.v.)
      if (error.response) {
        const status = error.response.status;

        // Xử lý lỗi 401 (Hết hạn token hoặc không hợp lệ)
        if (status === 401) {
          if (token) {
            if (isHandling401) return Promise.reject(error);
            isHandling401 = true;

            const appAge = Date.now() - appInitTime;
            if (appAge < 2000) {
              setTimeout(() => handleLogout(), 1500);
              return Promise.reject(error);
            }
            return handleLogout();
          }
        }

        // Xử lý lỗi 403 (Không có quyền - HẾT BỊ ĐỎ BIẾN TOKEN)
        if (status === 403 && token) {
          console.error("403: Quyền truy cập bị từ chối.");
          toast.error("Bạn không có quyền thực hiện hành động này.");
        }
      }
      // Trường hợp 2: Lỗi mạng (Server chưa bật)
      else if (error.code === "ERR_NETWORK") {
        toast.error("Không thể kết nối đến máy chủ. Vui lòng bật Backend!");
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
