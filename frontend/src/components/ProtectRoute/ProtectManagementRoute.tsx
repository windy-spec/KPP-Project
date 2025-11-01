import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "@/utils/api-user";

type Props = { children: React.ReactNode };

// Chỉ cho phép ADMIN truy cập trang quản trị
const ProtectManagementRoute: React.FC<Props> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setAllowed(false);
          setChecking(false);
          return;
        }
        const res = await apiClient.get("/users/me");
        const data = res.data as any;
        const role = data?.user?.role ?? data?.role;
        if (role === "admin") {
          setAllowed(true);
        } else {
          toast.error("Bạn không có quyền truy cập trang quản trị");
          setAllowed(false);
        }
      } catch (e) {
        // Interceptor sẽ lo phần 401/403
        setAllowed(false);
      } finally {
        setChecking(false);
      }
    };
    verify();
  }, []);

  if (checking) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-600">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!allowed) {
    // Nếu không có quyền: điều hướng về trang chủ
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectManagementRoute;
