"use client";

import { useRouter } from "next/navigation";
import { ActionButtonSimple } from "./action-button-simple";
import { authClient } from "@/lib/auth/auth-client";
import {
  requestNativeGoogleIdToken,
  isNativeSignInCancelled,
} from "@/lib/auth/native-social-login";
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
  const router = useRouter();

  const handleSocialSignIn = async () => {
    try {
      // Inside the Android app Google refuses the WebView redirect, so the
      // native credential flow is used instead and the session is established
      // directly inside the app's cookie jar.
      if (provider === "google") {
        const nativeIdToken = await requestNativeGoogleIdToken();

        if (nativeIdToken) {
          const { error } = await authClient.$fetch("/sign-in/social", {
            method: "POST",
            body: {
              provider,
              idToken: { token: nativeIdToken },
            },
          });

          if (error) {
            throw new Error(error.message || "Server rejected Google sign in token");
          }

          router.push(callbackURL);
          router.refresh();
          return;
        }
      }

      await authClient.signIn.social({
        provider,
        callbackURL,
      });
    } catch (error) {
      // A dismissed account picker is not an error worth reporting.
      if (isNativeSignInCancelled(error)) return;

      const msg = error instanceof Error && error.message ? error.message : `Failed to sign in with ${provider}`;
      toast.error(msg);
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
