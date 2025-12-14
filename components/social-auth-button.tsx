"use client";

import { ActionButtonSimple } from "./action-button-simple";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";

export interface SocialAuthButtonProps {
  provider: "google" | "github" | "twitter" | "facebook" | "apple";
  callbackURL?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SocialAuthButton({
  provider,
  callbackURL = "/dashboard",
  fullWidth = false,
  disabled = false,
  className,
}: SocialAuthButtonProps) {
  const handleSocialSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
      });
    } catch (error) {
      toast.error(`Failed to sign in with ${provider}`);
      console.error(`${provider} sign in error:`, error);
    }
  };

  return (
    <ActionButtonSimple
      socialButton={{
        provider,
        onClick: handleSocialSignIn,
      }}
      fullWidth={fullWidth}
      disabled={disabled}
      className={className}
    />
  );
}

export default SocialAuthButton;
