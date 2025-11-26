import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "./ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { Link } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import apiClient from "@/utils/api-user";

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

  // ====== State cho giới hạn đăng nhập ======
  const [failedAttempts, setFailedAttempts] = useState<number>(() =>
    parseInt(localStorage.getItem("failedAttempts") || "0")
  );
  const [lockUntil, setLockUntil] = useState<number | null>(() => {
    const saved = localStorage.getItem("lockUntil");
    return saved ? parseInt(saved) : null;
  });
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // ====== Cập nhật đếm ngược khi đang bị khóa ======
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (lockUntil) {
      interval = setInterval(() => {
        const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          // Chỉ mở khóa, không reset failedAttempts
          setLockUntil(null);
          localStorage.removeItem("lockUntil");
          setTimer(0);
          clearInterval(interval);
        } else {
          setTimer(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockUntil]);

  // ====== Hàm tính thời gian khóa dựa theo số lần sai ======
  const getLockDuration = (count: number): number | null => {
    if (count === 5) return 30 * 1000; // 30 giây
    if (count === 6) return 2 * 60 * 1000; // 2 phút
    if (count >= 7) return 5 * 60 * 1000; // 5 phút
    return null;
  };
  // ====== Hàm xử lý đăng nhập ======
  const onSubmit = async (data: SignInFormValues) => {
    // Nếu đang bị khóa
    if (lockUntil && Date.now() < lockUntil) {
      toast.error(
        `Tài khoản đang bị tạm khóa. Vui lòng thử lại sau ${timer} giây.`
      );
      return;
    }

    try {
      const response = await apiClient.post("/auth/signIn", data);

      if (response.status === 200) {
        const { accessToken } = response.data;

        // Reset lại số lần sai
        setFailedAttempts(0);
        localStorage.setItem("failedAttempts", "0");
        localStorage.removeItem("lockUntil");

        // Lưu token & thông báo
        localStorage.setItem("accessToken", accessToken);
        localStorage.removeItem("failedAttempts");
        await Swal.fire({
          title: "Đăng nhập thành công",
          text: "Bạn đã đăng nhập thành công, vui lòng chờ trong giây lát...",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      // Nếu sai thông tin (401)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const newCount = failedAttempts + 1;
        setFailedAttempts(newCount);
        localStorage.setItem("failedAttempts", newCount.toString());
        const lastChance = 5;
        const showLastChance = lastChance - newCount;
        if (showLastChance > 0) {
          await Swal.fire({
            title: "Thông báo",
            text: `Bạn hãy kiểm tra lại mật khẩu trước khi nhập, bạn còn ${showLastChance} lần thử.`,
            icon: "warning",
            timer: 3000,
            showConfirmButton: false,
          });
        }
        const duration = getLockDuration(newCount);
        if (duration) {
          const until = Date.now() + duration;
          setLockUntil(until);
          localStorage.setItem("lockUntil", until.toString());
          await Swal.fire({
            title: "Tài khoản bị khóa",
            text: `Bạn đã nhập sai ${newCount} lần. Vui lòng đợi ${
              duration / 1000
            } giây trước khi thử lại.`,
            icon: "warning",
            timer: duration,
            showConfirmButton: false,
          });
        } else {
          toast.error(`Sai thông tin đăng nhập (${newCount}/5).`);
        }
        return;
      }

      // Nếu lỗi mạng
      if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
        toast.error("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
        return;
      }

      toast.error("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");
    }
  };

  // ====== Giao diện ======
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center gap-2">
                <a href="/" className="mx-auto block w-fit text-center">
                  <img src="/logo22.svg" alt="logo" className="w-24 h-auto" />
                </a>
                <h1 className="text-2xl font-bold">Welcome Back!</h1>
                <p className="text-muted-foreground text-balance">
                  Đăng nhập vào tài khoản KPPaint của bạn!
                </p>
              </div>

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
                  disabled={!!lockUntil}
                />
                {errors.username && (
                  <p className="text-destructive text-sm">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="password" className="block text-sm">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    {...register("password")}
                    className="pr-10 border-gray-500"
                    disabled={!!lockUntil}
                    autoComplete="current-password"
                    data-password-toggle="true"
                  />
                  <button
                    type="button"
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

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !isValid || !!lockUntil}
              >
                {lockUntil
                  ? `Bị khóa (${timer}s)`
                  : isSubmitting
                  ? "Đang đăng nhập..."
                  : "Đăng nhập"}
              </Button>

              <div className="text-center text-sm">
                Chưa có tài khoản?{" "}
                <a
                  href="/signup"
                  className="text-orange-400 hover:text-orange-600"
                >
                  Đăng ký
                </a>
              </div>
              <div className="text-center text-sm">
                Quên mật khẩu?{" "}
                <a
                  href="/forget"
                  className="text-orange-400 hover:text-orange-600"
                >
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
      <div className="text-xs text-balance px-6 text-center text-muted-foreground">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <Link to="/dieu-khoan-dich-vu" className="font-bold">
          Điều khoản dịch vụ
        </Link>{" "}
        và{" "}
        <Link to="/chinh-sach-bao-mat" className="font-bold">
          Chính sách bảo mật
        </Link>
        .
      </div>
    </div>
  );
}
