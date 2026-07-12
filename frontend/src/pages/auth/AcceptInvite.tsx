import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAcceptInviteMutation } from "../../api/teamApi";
import { baseApi } from "../../api/baseApi";
import { useDispatch } from "react-redux";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { Shield, Check, AlertCircle } from "lucide-react";

const acceptInviteSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/\d/, "Must contain at least one number")
      .regex(/[@$!%*?&]/, "Must contain at least one special character (@$!%*?&)"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const AcceptInvite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [acceptInvite, { isLoading }] = useAcceptInviteMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password", "");

  const rules = [
    { label: "At least 8 characters", test: passwordValue.length >= 8 },
    { label: "One uppercase letter", test: /[A-Z]/.test(passwordValue) },
    { label: "One lowercase letter", test: /[a-z]/.test(passwordValue) },
    { label: "One number", test: /\d/.test(passwordValue) },
    { label: "One special character (@$!%*?&)", test: /[@$!%*?&]/.test(passwordValue) },
  ];

  const onSubmit = async (data: any) => {
    setFormError(null);
    try {
      await acceptInvite({
        token: token || "",
        name: data.name,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }).unwrap();

      // Invalidate the RTK query cache to fetch the newly authenticated user profile
      dispatch(baseApi.util.invalidateTags(["User", "Organization", "Team"]));

      showToast("success", "Welcome! Your operator workspace profile is fully set up.");
      navigate("/dashboard");
    } catch (err: any) {
      setFormError(err?.data?.message || "Failed to accept team invitation.");
      showToast("error", "Accept Invitation failed");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-6 lg:px-8 animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg mb-4">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-center text-3xl font-extrabold font-display tracking-tight text-brand-primary">
          Accept Team Invite
        </h2>
        <p className="mt-2 text-center text-sm text-brand-muted">
          Configure your operator account to join your company's security team.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-brand-border rounded-xl sm:px-10">
          {formError && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Operator Name"
              type="text"
              placeholder="Jordan Lee"
              error={errors.name?.message}
              {...register("name")}
            />

            <Input
              label="Choose Passkey / Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />

            <Input
              label="Confirm Passkey"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            {/* Password rules list */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                Operator Passkey Strength Criteria
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 border ${
                        rule.test
                          ? "bg-emerald-500 border-emerald-600 text-white"
                          : "bg-white border-slate-200 text-transparent"
                      }`}
                    >
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span
                      className={`text-[10px] font-semibold ${
                        rule.test ? "text-emerald-800" : "text-slate-500"
                      }`}
                    >
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Establish Account & Log In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
