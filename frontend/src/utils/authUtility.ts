import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Swal from "sweetalert2";
import apiClient, { setGlobalLogoutAction } from "../utils/api-user";
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
    await Swal.fire({
      title: "Phiên làm việc hết hạn",
      text: "Vui lòng đăng nhập lại để tiếp tục.",
      icon: "warning",
      timer: 3000,
      showConfirmButton: false,
    });
    navigate("/signin");
  };
  useEffect(() => {
    setGlobalLogoutAction(logoutAndRedirect);
  }, [navigate]);
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;
    const interval = setInterval(async () => {
      try {
        await apiClient.get("/users/me");
        console.log(" Token vẫn còn hiệu lực...");
      } catch (error) {
        console.warn(" Token đã hết hạn. Interceptor sẽ xử lý logout.");
        clearInterval(interval);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  return { logoutAndRedirect };
};
export default useAuthActions;
