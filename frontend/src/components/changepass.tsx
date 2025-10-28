import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "./ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Link } from "react-router-dom"; // Sửa import Link từ 'react-router' sang 'react-router-dom'
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// SỬA ĐỔI: Loại bỏ trường email khỏi schema
const changePassSchema = z.object({
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  otp: z
    .string()
    .length(6, "Mã OTP phải gồm đúng 6 ký tự")
    .regex(/^\d+$/, "Mã OTP chỉ được chứa chữ số"),
});

type ChangePassFormValues = z.infer<typeof changePassSchema>;

interface ApiResponse {
  success: boolean;
  message: string;
}

export function ChangepassForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const emailToDisplay = localStorage.getItem("resetEmail"); // Lấy email để hiển thị
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm<ChangePassFormValues>({
    resolver: zodResolver(changePassSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ChangePassFormValues) => {
    const API_URL = "http://localhost:5001/api/auth/reset-password";
    const emailValue = localStorage.getItem("resetEmail");
    if (!emailValue || emailValue === "undefined" || emailValue.length < 5) {
      toast.error("Phiên khôi phục đã hết hạn. Vui lòng nhập email lại.");
      localStorage.removeItem("resetEmail");
      window.location.replace("/forget");
      return;
    }
    const finalEmail: string = emailValue;
    const payload = {
      email: finalEmail,
      otp: data.otp,
      password: data.password,
    };
    try {
      const response = await axios.post<ApiResponse>(API_URL, payload);
      if (response.status === 200 && response.data.success) {
        localStorage.removeItem("resetEmail");
        await Swal.fire({
          title: "Thông báo",
          text: `Bạn đã đổi mật khẩu thành công, giờ chúng tôi sẽ chuyển hướng bạn quay lại trang đăng nhập`,
          timer: 3000,
          icon: "success",
          showConfirmButton: false,
        });
        window.location.replace("/signin");
        return;
      }
      toast.error(response.data.message || "Lỗi không xác định.");
    } catch (error) {
      console.error("Lỗi gọi API đổi mật khẩu: ", error);
      let errorMessage = "Đã xảy ra lỗi hệ thống hoặc lỗi kết nối máy chủ.";
      if (axios.isAxiosError(error) && error.response) {
      }
      toast.error(errorMessage);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  

  return (
    <div
      className={cn("flex flex-col gap-6 w-full max-w-2xl mx-auto", className)}
      {...props}
    >
      <Card className="overflow-hidden p-0 border-border ">
        <CardContent className="grid p-0">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* header - logo */}
              <div className="flex flex-col items-center text-center gap-2">
                <a href="/" className="mx-auto block w-fit text-center">
                  <img src="/logo22.svg" alt="logo" className="w-24 h-auto" />
                </a>
                <h1 className="text-2xl font-bold">Đổi mật khẩu</h1>
                <p className="text-muted-foreground text-balance">
                  Nhập mật khẩu mới
                </p>
                {/* HIỂN THỊ EMAIL ĐỂ NGƯỜI DÙNG XÁC NHẬN */}
                {emailToDisplay && (
                  <p className="text-sm font-medium text-center text-primary/80">
                    Email: <span className="font-bold">{emailToDisplay}</span>
                  </p>
                )}
              </div>

              {/* XÓA KHỐI INPUT EMAIL ĐỂ DÙNG EMAIL TỪ LOCALSTORAGE */}

              {/* otp */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="otp" className="block text-sm">
                  OTP
                </Label>
                <Input
                  type="text"
                  maxLength={6}
                  id="otp"
                  placeholder="XXXXXX"
                  {...register("otp")}
                />
                {errors.otp && (
                  <p className="text-destructive text-sm">
                    {errors.otp.message}
                  </p>
                )}
              </div>

              {/* password */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="password" className="block text-sm">
                  Mật khẩu mới
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    {...register("password")}
                    className="pr-10 border-gray-500"
                     autoComplete="new-password"
                     data-password-toggle="true"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* nút đổi*/}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Footer text */}
      <div className="text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offset-4">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <Link to="/dieu-khoan-dich-vu">Điều khoản dịch vụ</Link> và{" "}
        <Link to="/chinh-sach-bao-mat">Chính sách bảo mật của chúng tôi</Link>.
      </div>
    </div>
  );
}