import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "../../features/auth/schemas";
import { useResetPasswordMutation } from "../../api/authApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { KeyRound, CheckCircle, ArrowLeft } from "lucide-react";

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: any) => {
    if (!token) return;
    try {
      await resetPassword({ token, body: data }).unwrap();
      showToast("success", "Password successfully updated. Access keys rotated.");
      setIsSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      showToast("error", err?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg mb-4">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="text-center text-3xl font-extrabold font-display tracking-tight text-brand-primary">
          Configure Access Keys
        </h2>
        <p className="mt-2 text-center text-sm text-brand-muted">
          Define your new platform decryption keys below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-brand-border rounded-xl sm:px-10">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-brand-primary font-display">Keys Reconfigured</h3>
              <p className="text-sm text-brand-muted">
                Your password was updated successfully. Redirecting you to console sign in...
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline underline-offset-4"
                >
                  <ArrowLeft className="h-4 w-4" /> Go to log in
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Re-encrypt Keys
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
