import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Swal from "sweetalert2";
import apiClient, { setGlobalLogoutAction } from "../utils/api-user";

// KHAI BÁO TYPE CHO WINDOW 
// Để SweetAlert và cờ chặn đa luồng hoạt động mà không bị lỗi TypeScript
declare global {
  interface Window {
    __isLoggingOut?: boolean;
  }
}

const useAuthActions = () => {
  const navigate = useNavigate();

  const logoutAndRedirect = async () => {
    try {
      await apiClient.post("/auth/signOut");
      console.log(" LOGOUT: BE signOut thành công.");
    } catch (error) {
      console.warn(" LOGOUT: BE signOut thất bại, dọn dẹp FE...");
    }
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("justLoggedIn");

    // Dùng cờ này để ngăn không cho SweetAlert chạy nhiều lần nếu nhiều request 401 cùng lúc
    if (!window.__isLoggingOut) {
      window.__isLoggingOut = true;
      await Swal.fire({
        title: "Phiên làm việc hết hạn",
        text: "Vui lòng đăng nhập lại để tiếp tục.",
        icon: "warning",
        timer: 3000,
        showConfirmButton: false,
      });
      // Sau khi Swal kết thúc, cho phép logout tiếp theo
      window.__isLoggingOut = false;
    }

    navigate("/signin");
  };

  // Thiết lập hành động logout toàn cục cho Interceptor
  useEffect(() => {
    setGlobalLogoutAction(logoutAndRedirect);
  }, [navigate]);

  // LOGIC HEARTBEAT ĐỂ KIỂM TRA TOKEN CHỦ ĐỘNG
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    // Đặt một interval đơn giản để gửi request "heartbeat" đến server.
    // Nếu request này thất bại (401), Interceptor sẽ tự động xử lý logout.
    const interval = setInterval(async () => {
      try {
        // Gửi một request nhẹ để làm mới phiên (hoặc kiểm tra tính hợp lệ)
        await apiClient.get("/users/me");
        console.log(" Heartbeat: Token vẫn còn hiệu lực.");
      } catch (error) {
        // Không cần clearInterval ở đây, để Interceptor tự động bắt 401.
        console.warn(
          " Heartbeat thất bại. Interceptor sẽ quyết định hành động."
        );
      }
    }, 5 * 60 * 1000); // Check mỗi 5 phút

    return () => clearInterval(interval);
  }, [navigate]); // Thêm navigate vào dependency để đảm bảo không bị warning

  return { logoutAndRedirect };
};

export default useAuthActions;
