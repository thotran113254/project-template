import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { registerSchema } from "@app/shared";
import { getErrorMessage } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RegisterInput } from "@app/shared";

/** Register page with name/email/password form. Redirects to /dashboard on success. */
export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const [serverError, setServerError] = useState("");

  const onSubmit = async (data: RegisterInput) => {
    setServerError("");
    try {
      await registerUser(data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Tạo tài khoản</CardTitle>
          <CardDescription>Điền thông tin để đăng ký tài khoản mới</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {serverError && (
              <p className="rounded-md bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
                {serverError}
              </p>
            )}

            <FormField label="Tên hiển thị" error={errors.name?.message} htmlFor="name">
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                disabled={isSubmitting}
                {...register("name")}
              />
            </FormField>

            <FormField label="Email" error={errors.email?.message} htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
                {...register("email")}
              />
            </FormField>

            <FormField label="Mật khẩu" error={errors.password?.message} htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••"
                disabled={isSubmitting}
                {...register("password")}
              />
            </FormField>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
            </Button>
            <p className="text-sm text-[var(--muted-foreground)]">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-[var(--primary)] hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
