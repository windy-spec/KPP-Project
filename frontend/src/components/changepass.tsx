import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "./ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { Link } from "react-router";
// ❌ Dòng useNavigate sẽ không còn cần thiết cho việc chuyển hướng nữa
// import { useNavigate } from "react-router-dom";

// --- 1. SCHEMA VÀ TYPES ---
const changePassSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ")
    .min(1, "Email không được để trống"),
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

// --- 2. COMPONENT ---
export function ChangepassForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm<ChangePassFormValues>({
    resolver: zodResolver(changePassSchema),
    mode: "onChange",
  });

  // ✅ KHÔNG CẦN KHỞI TẠO navigate NỮA

  const onSubmit = async (data: ChangePassFormValues) => {
    const API_URL = "http://localhost:5001/api/auth/reset-password";

    try {
      const response = await axios.post<ApiResponse>(API_URL, data);

      if (response.status === 200 && response.data.success) {
        const successMessage =
          "Bạn đã đổi passWord thành công, giờ đã có thể đăng nhập vào website!";

        console.log("Thành công:", successMessage);
        reset(); // Xóa form

        // ✅ GIẢI PHÁP CUỐI CÙNG: Buộc chuyển hướng cứng bằng lệnh của trình duyệt
        window.location.replace("/signin");

        return;
      } else {
        // Xử lý lỗi nếu BE trả về 200 nhưng logic thất bại
        console.error(response.data.message || "Lỗi không xác định");
      }
    } catch (error) {
      console.error("Lỗi gọi API đổi mật khẩu: ", error);

      let errorMessage = "Đã xảy ra lỗi hệ thống hoặc lỗi kết nối máy chủ.";

      if (axios.isAxiosError(error) && error.response) {
        const axiosError = error as AxiosError<ApiResponse>;
        errorMessage =
          axiosError.response?.data?.message || "Lỗi xử lý yêu cầu.";
      }

      console.error("Lỗi:", errorMessage);
    }
  };

  // --- 3. RENDER UI ---
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
                />
                {errors.email && (
                  <p className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>

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
                <Input
                  type="password"
                  id="password"
                  {...register("password")}
                />
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
