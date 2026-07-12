import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../features/auth/schemas";
import { useLoginMutation, useGoogleLoginMutation } from "../../api/authApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { GoogleSignInButton } from "../../components/ui/GoogleSignInButton";
import { Shield, AlertTriangle } from "lucide-react";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);

  // Google OAuth flow: check if orgName is requested by server
  const [showGoogleOrgModal, setShowGoogleOrgModal] = useState(false);
  const [googleToken, setGoogleToken] = useState("");
  const [googleOrgName, setGoogleOrgName] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: any) => {
    setFormError(null);
    try {
      const response = await login(data).unwrap();
      showToast("success", `Welcome back, ${response.data.user.name}!`);
      if (response.data.isOnboarded) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } catch (err: any) {
      console.log(err);
      setFormError("Invalid credentials. Please verify your email and password.");
      showToast("error", "Login failed");
    }
  };

  const completeGoogleLogin = async (idToken: string, organizationName?: string) => {
    setFormError(null);
    try {
      const response = await googleLogin({
        idToken,
        organizationName: organizationName || undefined,
      }).unwrap();
      showToast("success", `Successfully authenticated via Google Account.`);
      if (response.data.isOnboarded) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } catch (err: any) {
      console.log("Error:",err);
      if (err.status === 412) {
        setGoogleToken(idToken);
        setShowGoogleOrgModal(true);
      } else {
        setFormError("Google Authentication failed. Please try again.");
      }
    }
  };

  const handleGoogleWithOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (googleOrgName.trim().length < 2) {
      showToast("error", "Please provide a valid organization name");
      return;
    }
    setShowGoogleOrgModal(false);
    await completeGoogleLogin(googleToken, googleOrgName);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg mb-4">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-center text-3xl font-extrabold font-display tracking-tight text-brand-primary">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-brand-muted">
          Or{" "}
          <Link to="/signup" className="font-semibold text-slate-800 hover:text-slate-950 underline underline-offset-4">
            register a new security organization
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-brand-border rounded-xl sm:px-10">
          {formError && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex gap-2 items-start animate-shake">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email Address"
              type="email"
              placeholder="operator@company.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-950 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Access Console
            </Button>
          </form>

          {/* Google OAuth Section */}
          <div className="mt-6">
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-border" />
              </div>
              <span className="relative px-3 bg-white text-xs font-mono text-brand-muted uppercase">
                Secure OAuth Provider
              </span>
            </div>

            <GoogleSignInButton
              onIdToken={(idToken) => completeGoogleLogin(idToken)}
              onError={() => setFormError("Google Authentication failed. Please try again.")}
              isLoading={isGoogleLoading}
            />
          </div>
        </div>
      </div>

      {/* Google Org Name Modal */}
      {showGoogleOrgModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full border border-brand-border shadow-2xl">
            <h3 className="text-base font-semibold text-brand-primary tracking-tight mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5" /> Organization Required
            </h3>
            <p className="text-xs text-brand-muted mb-4">
              Since this is your first time signing up with Google, please declare your security organization name to partition your tech inventory.
            </p>
            <form onSubmit={handleGoogleWithOrgSubmit} className="space-y-4">
              <Input
                label="Organization Name"
                type="text"
                placeholder="e.g. Cyberdyne Systems"
                value={googleOrgName}
                onChange={(e) => setGoogleOrgName(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowGoogleOrgModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Initialize Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
