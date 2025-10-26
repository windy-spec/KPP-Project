// File: ForgetpassForm.tsx (Hoàn chỉnh)

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "./ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Link } from "react-router";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

// Schema đã được tối ưu hóa
const forgetPassSchema = z.object({
  email: z.email("Email không hợp lệ"),
});

type ForgetPassFormValues = z.infer<typeof forgetPassSchema>;

export function ForgetpassForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ForgetPassFormValues>({
    resolver: zodResolver(forgetPassSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: ForgetPassFormValues) => {
    const API_URL = "http://localhost:5001/api/auth/forgot-password";

    try {
      const response = await axios.post(API_URL, data);
      // if Email exists
      if (response.status === 200 && response.data.success) {
        localStorage.setItem("resetEmail", response.data.email);
        await Swal.fire({
          title: "Gửi mã thành công",
          text: "Hệ thống đã gửi mã thành công, vui lòng kiểm tra tin nhắn trong email của bạn.",
          timer: 3000,
          icon: "success",
          showConfirmButton: false,
        });
        window.location.href = "/changepass";
        return;
      }
      // check if Email didn't exists
      else if (response.status === 200 && !response.data.success) {
        const beMessage = response.data.message || "Lỗi không xác định.";
        await Swal.fire({
          title: "Thông báo",
          text: beMessage,
          timer: 3000,
          icon: "info",
          showConfirmButton: false,
        });
        return;
      } else response.data.message;
      toast.error(response.data.message);
    } catch (error) {
      console.error("Lỗi gửi OTP:", error);
      let errorMessage = "Lỗi kết nối máy chủ hoặc lỗi không xác định.";
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const beMessage = error.response.data?.message;
        if (status === 404) {
          errorMessage = beMessage || "Tài khoản không tồn tại trong hệ thống.";
        } else {
          errorMessage = beMessage || `Lỗi không xác định từ BE (${status})`;
        }
      }
      toast.error(errorMessage);
    }
  };
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
                <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
                <p className="text-muted-foreground text-balance">
                  Nhập email để gửi OTP
                </p>
              </div>
              {/* email */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="email" className="block text-sm">
                  Email
                </Label>
                <Input
                  type="text"
                  id="email"
                  placeholder="k@gmail.com"
                  {...register("email")}
                  className="border-gray-500"
                />
                {errors.email && (
                  <p className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>
              {/* nút sen OTP*/}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !isValid}
              >
                Gửi mã OTP
              </Button>

              <div className="text-center text-sm">
                Đã nhớ tài khoản?{" "}
                <a href="/signin" className="underline underline-offset-4">
                  Đăng nhập ngay
                </a>
              </div>
            </div>
          </form>
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
