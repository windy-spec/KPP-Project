import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "./ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
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
  });

  const onSubmit = async (data: ForgetPassFormValues) => {
    const API_URL = "http://localhost:5001/api/auth/forgot-password";
    try {
      const response = await axios.post(API_URL, data);
      if (response.status === 200 && response.data.success) {
        const successMessage =
          "Yêu cầu khôi phục mật khẩu của bạn đã thành công, hãy kiểm tra hộp thư đến!";
        alert(successMessage);
        window.location.href = "/changepass";
      } else {
        alert(response.data.message || "Lỗi không xác định");
      }
    } catch (error) {
      console.error("Lỗi gì đó: ", error);
      let errorMessage = "Đã xảy ra lỗi hệ thống";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage =
          error.response.data?.message || "Sai thông tin đăng nhập";
      }
      alert(errorMessage);
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
        Bằng cách tiếp tục, bạn đồng ý với <a href="#">Điều khoản dịch vụ</a> và{" "}
        <a href="#">Chính sách bảo mật của chúng tôi</a>.
      </div>
    </div>
  );
}
