import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm, Watch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

//Zod validate
const vietnameseNameRegex = /^[A-Za-zÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;
const signUpSchema = z.object({
  firstname: z.string().min(1, "Tên bắt buộc phải có").regex(vietnameseNameRegex, "Tên chỉ được chứa chữ cái tiếng Việt"),
  lastname: z.string().min(1, "Họ bắt buộc phải có").regex(vietnameseNameRegex, "Họ chỉ được chứa chữ cái tiếng Việt"),
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  email: z.email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string().min(6, "Vui lòng nhập lại mật khẩu"),
})
.refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"], // chỉ định lỗi hiển thị ở confirmPassword
});


type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: SignUpFormValues) => {
    const API_URL = "http://localhost:5001/api/auth/signUp";

    try {
      const response = await axios.post(API_URL, data);
      if (response.status === 200 || response.status === 201) {
        await Swal.fire({
          title: "Đăng ký thành công",
          text: "Tài khoản của bạn đã được tạo, bạn sẽ được chuyển hướng sang trang đăng nhập",
          icon: "success",
          timer: 4000,
          showConfirmButton: false,
        }).then(() => {
          try {
            navigate("/signin");
          } catch (navError) {
            console.error("LỖI CHUYỂN HƯỚNG REACT ROUTER (RUNTIME):", navError);
            window.location.href = "/signin";
          }
        });
        return;
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      let errorMessage = "Đã xảy ra lỗi hệ thống.";

      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const beMessage = error.response.data?.message;
        if (status === 409) {
          await Swal.fire({
            title: "Lỗi hệ thống",
            text:
              beMessage ||
              "Username bạn đặt đã tồn tại, hãy thử username khác.",
            icon: "error",
            timer: 2000,
            showConfirmButton: false,
          });
          return;
        } else if (status === 505) {
          await Swal.fire({
            title: "Lỗi hệ thống",
            text: "Email đã tồn tại cho 1 tài khoản rồi, xin hãy thử lại với email khác.",
            icon: "error",
            timer: 2000,
            showConfirmButton: false,
          });
          return;
        }
        errorMessage = beMessage || `Lỗi không xác định từ BE (${status}).`;
      } else if (axios.isAxiosError(error) && error.code === "ERR_NETWORK") {
        errorMessage = "Không thể kết nối tới máy chủ. Vui lòng thử lại.";
      }
      toast.error(errorMessage);
    }
  };


  // lấy giá trị hiện tại của password và confirmPassword
  const passwordValue = watch("password");
  const confirmPasswordValue = watch("confirmPassword");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [confirmStrength, setConfirmStrength] = useState(0);


  // Gán strength cho password
  useEffect(() => {
    setStrength(calculateStrength(passwordValue || ""));
  }, [passwordValue]);

  // Gán strength cho confirm password
  useEffect(() => {
    setConfirmStrength(calculateStrength(confirmPasswordValue || ""));
  }, [confirmPasswordValue]);

  //PasswordStrength
  const calculateStrength = (password: string) => {
      let score = 0;
      if (password.length >= 6) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
      if (password.length >= 10) score++;
      return score;
  };

  const getStrengthLabel = (score: number) => {
      switch (score) {
        case 0:
        case 1:
          return { label: "Yếu", color: "bg-red-500" };
        case 2:
          return { label: "Trung bình", color: "bg-yellow-500" };
        case 3:
          return { label: "Khá mạnh", color: "bg-orange-500" };
        case 4:
          return { label: "Mạnh", color: "bg-green-500" };
        case 5:
          return { label: "Rất Mạnh", color: "bg-blue-500" };
        default:
          return { label: "", color: "" };
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border translate-y-5">
        <CardContent className="grid md:grid-cols-2">

          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div className="flex flex-col gap-6">
              {/* header - logo */}
              <div className="flex flex-col items-center text-center gap-2">
                <a href="/" className="mx-auto block w-fit text-center">
                  <img src="/logo22.svg" alt="logo" className="w-24 h-auto" />
                </a>
                <h1 className="text-2xl font-bold">Tạo tài khoản KPPaint</h1>
                <p className="text-muted-foreground text-balance">
                  Chào mừng bạn! Hãy đăng ký để bắt đầu!
                </p>
              </div>
              
              {/* họ và tên */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Input type="text" id="lastname" placeholder="Họ" {...register("lastname")} className="border-gray-500"/>
                  {errors.lastname && (
                    <p className="text-destructive text-sm">
                      {errors.lastname.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    id="firstname"
                    placeholder="Tên"
                    {...register("firstname")}
                    className="border-gray-500"
                  />
                  {errors.firstname && (
                    <p className="text-destructive text-sm">
                      {errors.firstname.message}
                    </p>
                  )}
                </div>
              </div>

              {/* username */}
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  id="username"
                  placeholder="Tên đăng nhập"
                  {...register("username")}
                  className="border-gray-500"
                />
                {errors.username && (
                  <p className="text-destructive text-sm">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* email */}
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  id="email"
                  placeholder="Email (vd:kppaint@gmail.com)"
                  {...register("email")}
                  className="border-gray-500"
                />
                {errors.email && (
                  <p className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* password */}
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Mật khẩu"
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

                {/* ✅ hiển thị thanh độ mạnh */}
                {passwordValue && (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthLabel(
                          strength
                        ).color}`}
                        style={{ width: `${(strength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {getStrengthLabel(strength).label}
                    </span>
                  </div>
                )}

                {errors.password && (
                  <p className="text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* confirm password */}
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    placeholder="Nhập lại mật khẩu"
                    {...register("confirmPassword")}
                    className="pr-10 border-gray-500"
                    autoComplete="new-password"
                    data-password-toggle="true"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* ✅ hiển thị thanh độ mạnh */}
                {confirmPasswordValue && (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthLabel(
                          confirmStrength
                        ).color}`}
                        style={{ width: `${(confirmStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {getStrengthLabel(confirmStrength).label}
                    </span>
                  </div>
                )}

                {errors.confirmPassword && (
                  <p className="text-destructive text-sm">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* nút đăng ký */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !isValid}
              >
                Tạo tài khoản
              </Button>

              <div className="text-center text-sm">
                Đã có tài khoản?{" "}
                <a href="/signin" className="underline underline-offset-4">
                  Đăng nhập
                </a>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholderSignUp.png"
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
