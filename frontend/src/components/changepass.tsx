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
import Swal from "sweetalert2";
import toast from "react-hot-toast";
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
  const onSubmit = async (data: ChangePassFormValues) => {
    const API_URL = "http://localhost:5001/api/auth/reset-password";

    // 1. LẤY EMAIL BẢO VỆ TỪ LOCAL STORAGE
    const emailToReset = localStorage.getItem("resetEmail");

    // Kiểm tra bảo mật phụ: Nếu người dùng bằng cách nào đó vượt qua Protected Route
    if (!emailToReset) {
      toast.error("Phiên khôi phục đã hết hạn. Vui lòng nhập email lại.");
      window.location.replace("/forget");
      return;
    }
    const payload = {
      email: emailToReset,
      otp: data.otp,
      password: data.password,
    };

    try {
      // 2. GỌI API VỚI PAYLOAD ĐẦY ĐỦ
      const response = await axios.post<ApiResponse>(API_URL, payload);

      // --- KHỐI THÀNH CÔNG (status 200, thành công) ---
      if (response.status === 200 && response.data.success) {
        // BẢO VỆ: XÓA SESSION KHÔI PHỤC KHI THÀNH CÔNG
        localStorage.removeItem("resetEmail");

        await Swal.fire({
          title: "Cập nhật thành công",
          text: "Bạn đã thay đổi mật khẩu thành công, giờ bạn có thể đăng nhập vào trang web",
          timer: 3000,
          icon: "success",
          showConfirmButton: false,
        });
        window.location.replace("/signin");
        return;
      }

      // --- KHỐI LỖI LOGIC 200/success:false (Ví dụ: OTP sai) ---
      toast.error(response.data.message || "Lỗi không xác định.");
    } catch (error) {
      // --- KHỐI LỖI CATCH (4xx, 5xx) ---
      console.error("Lỗi gọi API đổi mật khẩu: ", error);
      let errorMessage = "Đã xảy ra lỗi hệ thống hoặc lỗi kết nối máy chủ.";

      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        // XỬ LÝ LỖI OTP HẾT HẠN (400 + errorCode)
        if (status === 400 && errorData?.errorCode === "OTP_EXPIRED") {
          console.warn("LỖI LOGIC: Mã OTP đã hết hạn. Chuyển hướng về Forget.");

          // BẢO VỆ: XÓA SESSION KHÔI PHỤC VÌ NÓ ĐÃ HẾT HẠN
          localStorage.removeItem("resetEmail");

          await Swal.fire({
            title: "Hết hạn mã",
            text: errorData.message,
            icon: "warning",
            timer: 3000,
            showConfirmButton: false,
          });

          // CHUYỂN HƯỚNG: Quay lại trang nhập email
          window.location.replace("/forget");
          return;
        }

        // Xử lý các lỗi HTTP khác (OTP sai, 401, 500, v.v.)
        errorMessage = errorData.message || `Lỗi xử lý yêu cầu (${status}).`;
      }

      // Hiển thị Toast cho tất cả lỗi còn lại
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
