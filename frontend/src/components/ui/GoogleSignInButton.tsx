// components/GoogleSignInButton.tsx
import React from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

interface GoogleSignInButtonProps {
  onIdToken: (idToken: string) => void;
  onError: () => void;
  isLoading?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onIdToken,
  onError,
  isLoading,
}) => {
  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError();
      return;
    }
    onIdToken(credentialResponse.credential);
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-2 px-4 border border-brand-border rounded-lg bg-white text-sm font-semibold text-brand-secondary">
        Authenticating...
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={onError}
        theme="outline"
        size="large"
        width="100%"
        text="continue_with"
      />
    </div>
  );
};
