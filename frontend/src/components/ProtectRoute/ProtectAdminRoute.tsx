import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface ProtectAdminRouteProps {
  children: React.ReactNode;
}

const ProtectAdminRoute: React.FC<ProtectAdminRouteProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5001/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setIsAuthorized(false);
        } else {
          const data = await res.json();
          // So sánh chính xác role admin
          setIsAuthorized(data.user?.role === "admin");
        }
      } catch (error) {
        console.error("Lỗi khi xác thực admin:", error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRole();
  }, []);

  if (isLoading)
    return <div className="text-center mt-8">Đang kiểm tra quyền...</div>;

  // Nếu không phải admin → redirect
  if (!isAuthorized) return <Navigate to="/" replace />;

  // Nếu là admin → cho vào trang
  return <>{children}</>;
};

export default ProtectAdminRoute;
