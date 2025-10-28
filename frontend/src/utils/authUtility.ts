import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Swal from "sweetalert2";
import apiClient, { setGlobalLogoutAction } from "../utils/api-user";

/**
 * Hook quản lý hành động đăng xuất (logout) và kiểm tra token.
 * - Tự động logout khi token hết hạn (cả khi reload lẫn khi đang ở trang).
 * - Kết nối với Axios Interceptor để đồng bộ logout toàn hệ thống.
 */
const useAuthActions = () => {
  const navigate = useNavigate();

  // ===============================
  // 1️⃣ HÀM LOGOUT CHÍNH
  // ===============================
  const logoutAndRedirect = async () => {
    try {
      await apiClient.post("/auth/signOut");
      console.log("✅ LOGOUT: BE signOut thành công.");
    } catch (error) {
      console.warn("⚠️ LOGOUT: BE signOut thất bại, dọn dẹp FE...");
    }

    // Xóa token & cờ bảo vệ
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("justLoggedIn");

    // Hiển thị thông báo hết hạn
    await Swal.fire({
      title: "Phiên làm việc hết hạn",
      text: "Vui lòng đăng nhập lại để tiếp tục.",
      icon: "warning",
      timer: 3000,
      showConfirmButton: false,
    });

    // Điều hướng về trang đăng nhập
    navigate("/signin");
  };

  // ===============================
  // 2️⃣ ĐĂNG KÝ LOGOUT VỚI INTERCEPTOR
  // ===============================
  useEffect(() => {
    setGlobalLogoutAction(logoutAndRedirect);
  }, [navigate]);

  // ===============================
  // 3️⃣ KIỂM TRA TOKEN KHI LOAD TRANG
  // ===============================
  useEffect(() => {
    const checkTokenOnLoad = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const justLoggedIn = sessionStorage.getItem("justLoggedIn");

      // ⚡ Ngăn logout ngay sau khi vừa login
      if (justLoggedIn === "true") {
        console.log("DEBUG: Vừa đăng nhập, bỏ qua kiểm tra token khởi động.");
        setTimeout(() => {
          sessionStorage.removeItem("justLoggedIn");
          console.log("DEBUG: Đã xoá cờ justLoggedIn sau 3s.");
        }, 3000);
        return;
      }

      if (accessToken) {
        try {
          await apiClient.get("/users/me");
          console.log("✅ Token hợp lệ khi tải trang.");
        } catch (error) {
          console.warn(
            "🚨 Token hết hạn khi tải trang. Interceptor sẽ xử lý..."
          );
        }
      } else {
        console.log(
          "Không tìm thấy token trong LocalStorage → chuyển hướng signin."
        );
        navigate("/signin");
      }
    };

    const tokenCheckTimeout = setTimeout(() => {
      checkTokenOnLoad();
    }, 1500);

    return () => clearTimeout(tokenCheckTimeout);
  }, [navigate]);
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;
    const interval = setInterval(async () => {
      try {
        await apiClient.get("/users/me");
        console.log("🟢 Token vẫn còn hiệu lực...");
      } catch (error) {
        console.warn("🔴 Token đã hết hạn. Interceptor sẽ xử lý logout.");
        clearInterval(interval);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { logoutAndRedirect };
};

export default useAuthActions;
