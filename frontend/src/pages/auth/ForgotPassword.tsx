import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "../../features/auth/schemas";
import { useForgotPasswordMutation } from "../../api/authApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { Shield, Key, ArrowLeft, MailCheck } from "lucide-react";

export const ForgotPassword: React.FC = () => {
  const { showToast } = useToast();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: any) => {
    try {
      await forgotPassword(data).unwrap();
      showToast("success", "Password recovery email dispatched successfully.");
      setIsSuccess(true);
    } catch (err: any) {
      showToast("error", err?.data?.message || "Verification request failed.");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg mb-4">
          <Key className="h-6 w-6" />
        </div>
        <h2 className="text-center text-3xl font-extrabold font-display tracking-tight text-brand-primary">
          Recover Password
        </h2>
        <p className="mt-2 text-center text-sm text-brand-muted">
          Provide your email below to request security decryption links.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-brand-border rounded-xl sm:px-10">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <MailCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-brand-primary font-display">Check your inbox</h3>
              <p className="text-sm text-brand-muted">
                We've sent a secure reset link to your email address. Please follow the instructions to configure your keys.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline underline-offset-4"
                >
                  <ArrowLeft className="h-4 w-4" /> Return to console
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Email Address"
                type="email"
                placeholder="operator@company.com"
                error={errors.email?.message}
                {...register("email")}
              />

              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Request Recovery Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-secondary hover:text-brand-primary"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
