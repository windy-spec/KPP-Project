import React from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
interface ProtectRouteProps {
  children: React.ReactNode;
}
const ProtectChangePassRoute = ({ children }: ProtectRouteProps) => {
  const resetEmail = localStorage.getItem("resetEmail");

  if (!resetEmail) {
    toast.error("Phiên khôi phục không hợp lệ. Vui lòng bắt đầu lại.", {
      duration: 3000,
    });
    return <Navigate to="/forget" replace />;
  }
  return children;
};

export default ProtectChangePassRoute;
