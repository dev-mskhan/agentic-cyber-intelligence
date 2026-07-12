import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "../../features/auth/schemas";
import { useSignupMutation } from "../../api/authApi";
import { useGoogleLoginMutation } from "../../api/authApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { GoogleSignInButton } from "../../components/ui/GoogleSignInButton";
import { Shield, AlertCircle } from "lucide-react";
import { EmailVerificationPending } from "@/src/components/ui/EmailVeificationPending";

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [signup, { isLoading }] = useSignupMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);

  // Google OAuth flow: check if orgName is requested by server
  const [showGoogleOrgModal, setShowGoogleOrgModal] = useState(false);
  const [googleToken, setGoogleToken] = useState("");
  const [googleOrgName, setGoogleOrgName] = useState("");
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      organizationName: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Lets "Continue with Google" reuse whatever the user already typed in the
  // Organization Name field, instead of always forcing the modal.
  const typedOrganizationName = watch("organizationName");

  const onSubmit = async (data: any) => {
    setFormError(null);
    try {
      const response = await signup(data).unwrap();
      setSignedUpEmail(data.email);
      setPendingToken(response.data.pendingToken);
    } catch (err: any) {
      setFormError(err?.data?.message || "Registration failed. Please make sure inputs are valid.");
      showToast("error", "Signup failed");
    }
  };

  const completeGoogleSignup = async (idToken: string, organizationName?: string) => {
    setFormError(null);
    try {
      const response = await googleLogin({
        idToken,
        organizationName: organizationName || undefined,
      }).unwrap();

      showToast("success", "Successfully signed up via Google Account.");
      if (!response.data.isOnboarded) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      if (err.status === 412) {
        setGoogleToken(idToken);
        setShowGoogleOrgModal(true);
      } else {
        setFormError(err?.data?.message || "Google Authentication failed. Please try again.");
      }
    }
  };

  const handleGoogleClick = (idToken: string) => {
    const trimmedOrgName = typedOrganizationName?.trim();
    if (trimmedOrgName && trimmedOrgName.length >= 2) {
      completeGoogleSignup(idToken, trimmedOrgName);
    } else {
      setGoogleToken(idToken);
      setShowGoogleOrgModal(true);
    }
  };

  const handleGoogleWithOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (googleOrgName.trim().length < 2) {
      showToast("error", "Please provide a valid organization name");
      return;
    }
    setShowGoogleOrgModal(false);
    await completeGoogleSignup(googleToken, googleOrgName);
  };

  if (signedUpEmail && pendingToken) {
    return <EmailVerificationPending email={signedUpEmail} pendingToken={pendingToken} />;
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg mb-4">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-center text-3xl font-extrabold font-display tracking-tight text-brand-primary">
          Register Organization
        </h2>
        <p className="mt-2 text-center text-sm text-brand-muted">
          Or{" "}
          <Link to="/login" className="font-semibold text-slate-800 hover:text-slate-950 underline underline-offset-4">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-md border border-brand-border rounded-xl sm:px-10">
          {formError && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Sarah Connor"
                error={errors.name?.message}
                {...register("name")}
              />
              <Input
                label="Corporate Email"
                type="email"
                placeholder="operator@company.com"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <Input
              label="Organization Name"
              type="text"
              placeholder="Cyberdyne Systems LLC"
              error={errors.organizationName?.message}
              {...register("organizationName")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register("password")}
                />
                <p className="mt-1.5 text-[11px] text-brand-muted">
                  Min. 8 characters, with uppercase, lowercase, number & symbol (@$!%*?&)
                </p>
              </div>

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
              Initialize Workspace
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
              onIdToken={handleGoogleClick}
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
