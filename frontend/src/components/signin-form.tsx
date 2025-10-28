import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "./ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { isValid } from "zod/v3";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { Link } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
const signInSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: SignInFormValues) => {
    const API_URL = "http://localhost:5001/api/auth/signIn";
    try {
      const response = await axios.post(API_URL, data);

      if (response.status == 200) {
        const { accessToken } = response.data;

        // 1. [FIX] LƯU TOKEN TRƯỚC KHI BẮT ĐẦU CHUYỂN HƯỚNG
        localStorage.setItem("accessToken", accessToken);
        console.log("Access Token", accessToken); // Giữ log ở đây

        await Swal.fire({
          title: "Đăng nhập thành công",
          text: "Bạn đã đăng nhập thành công, vui lòng chờ trong giây lát ",
          icon: "success",
          timer: 3000,
          showConfirmButton: false,
        });

        // 2. Chuyển hướng chỉ sau khi Swal đóng
        window.location.href = "/";
        return;
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      let errorMessage = "Đã xảy ra lỗi hệ thống.";

      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const beMessage = error.response.data?.message;

        // 1. XỬ LÝ LỖI 400 (Dùng Swal)
        if (status === 401) {
          await Swal.fire({
            title: "Lỗi Đăng nhập",
            text: beMessage || "Vui lòng kiểm tra lại Username và Password.",
            icon: "error",
            timer: 2000,
            showConfirmButton: false,
          });
          return; // [FIX] Thoát khỏi hàm sau khi hiển thị Swal
        }

        // 2. Xử lý các lỗi khác (401, 409, 500)
        errorMessage = beMessage || `Lỗi không xác định từ BE (${status}).`;
      } else if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
        errorMessage = "Không thể kết nối tới máy chủ. Vui lòng thử lại.";
      }

      // Hiển thị Toast cho tất cả lỗi còn lại (401, Mạng, 500)
      toast.error(errorMessage);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* header - logo */}
              <div className="flex flex-col items-center text-center gap-2">
                <a href="/" className="mx-auto block w-fit text-center">
                  <img src="/logo22.svg" alt="logo" className="w-24 h-auto" />
                </a>
                <h1 className="text-2xl font-bold">Welcome Back!</h1>
                <p className="text-muted-foreground text-balance">
                  Đăng nhập vào tài khoản KPPaint của bạn!
                </p>
              </div>
              
              {/* username */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="username" className="block text-sm">
                  Tên đăng nhập
                </Label>
                <Input
                  type="text"
                  id="username"
                  placeholder="kppaint"
                  {...register("username")}
                  className="border-gray-500"
                />
                {errors.username && (
                  <p className="text-destructive text-sm">
                    {errors.username.message}
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

              {/* nút đăng nhập */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !isValid}
              >
                Đăng nhập
              </Button>

              <div className="text-center text-sm">
                Chưa có tài khoản?{" "}
                <a href="/signup" className="underline underline-offset-4">
                  Đăng ký
                </a>
              </div>
              <div className="text-center text-sm">
                Quên mật khẩu?{" "}
                <a href="/forget" className="underline underline-offset-4">
                  Nhấn vào đây
                </a>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.png"
              alt="Image"
              className="absolute top-1/2 -translate-y-1/2 object-cover"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offset-4">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <Link to="/dieu-khoan-dich-vu">Điều khoản dịch vụ</Link> và{" "}
        <Link to="/chinh-sach-bao-mat">Chính sách bảo mật của chúng tôi</Link>.
      </div>
    </div>
  );
}
