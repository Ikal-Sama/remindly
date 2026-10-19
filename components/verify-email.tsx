"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSwap } from "./loading-swap";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import Link from "next/link";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export function VerifyEmail({
  email,
  className,
  onBack,
  onVerified,
  ...props
}: React.ComponentProps<"div"> & {
  email: string;
  onBack?: () => void;
  onVerified?: () => void;
}) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeToNextResend, setTimeToNextResend] = useState(
    RESEND_COOLDOWN_SECONDS
  );
  const interval = useRef<NodeJS.Timeout>(undefined);

  // Declared before the effects that use it: the react-hooks rules require
  // every value referenced by an effect to be initialised before it.
  function startCountdownInterval() {
    interval.current = setInterval(() => {
      setTimeToNextResend((t) => {
        const newT = t - 1;
        if (newT <= 0) {
          clearInterval(interval.current);
          return 0;
        }
        return newT;
      });
    }, 1000);
  }

  function startResendCountdown(time = RESEND_COOLDOWN_SECONDS) {
    setTimeToNextResend(time);
    startCountdownInterval();
  }

  useEffect(() => {
    // The cooldown already starts at RESEND_COOLDOWN_SECONDS, so only the
    // ticker needs starting here - calling setTimeToNextResend would be a
    // synchronous setState inside the effect and trigger a cascading render.
    startCountdownInterval();
  }, []);

  useEffect(() => {
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, []);

  const handleVerify = async () => {
    const otp = code.trim();

    if (!email) {
      toast.error("Email address is required");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      toast.error(`Enter the ${OTP_LENGTH}-digit code from your email`);
      return;
    }

    setIsVerifying(true);

    try {
      const res = await authClient.emailOtp.verifyEmail({ email, otp });

      if (res.error) {
        toast.error(res.error.message || "That code is not valid");
        setCode("");
        return;
      }

      toast.success("Email verified!");
      onVerified?.();
    } catch {
      toast.error("Something went wrong verifying your email");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Email address is required");
      return;
    }

    if (timeToNextResend > 0) {
      toast.error(`Please wait ${timeToNextResend} seconds before resending`);
      return;
    }

    setIsResending(true);
    try {
      const res = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (res.error) {
        toast.error(res.error.message || "Failed to send verification code");
      } else {
        toast.success("Verification code sent!");
        startResendCountdown();
      }
    } catch {
      toast.error("An error occurred while sending the verification code");
    } finally {
      setIsResending(false);
    }
  };

  const canVerify = code.trim().length === OTP_LENGTH && !isVerifying;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            We sent a {OTP_LENGTH}-digit code to your email. Enter it below to
            activate your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              {email && `Code sent to: ${email}`}
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code" className="sr-only">
                Verification code
              </Label>
              <Input
                id="verification-code"
                value={code}
                onChange={(event) =>
                  setCode(
                    // Digits only, capped at the expected length.
                    event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH)
                  )
                }
                onPaste={(event) => {
                  // Replace the whole field rather than letting the browser
                  // append at the caret. Without this, pasting a code while
                  // anything is already typed produces a silently wrong
                  // number - e.g. "123" then pasting "456789" yields "123456".
                  const pasted = event.clipboardData
                    .getData("text")
                    .replace(/\D/g, "");
                  if (!pasted) return;
                  event.preventDefault();
                  setCode(pasted.slice(0, OTP_LENGTH));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canVerify) {
                    void handleVerify();
                  }
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_LENGTH}
                placeholder="000000"
                disabled={isVerifying}
                // `pl` matches the tracking so the spaced digits stay optically
                // centred - letter-spacing also adds space after the final
                // character, which would otherwise shift them left.
                className="text-center text-2xl tracking-[0.5em] pl-[0.5em] font-mono"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={!canVerify}
            >
              {isVerifying ? "Verifying…" : "Verify email"}
            </Button>

            <Button
              variant="outline"
              onClick={handleResendVerification}
              disabled={isResending || timeToNextResend > 0}
              className="w-full"
            >
              <LoadingSwap isLoading={isResending}>
                {timeToNextResend > 0
                  ? `Resend code in ${timeToNextResend}s`
                  : "Resend code"}
              </LoadingSwap>
            </Button>

            <p className="text-sm text-muted-foreground">
              Didn&apos;t get the code? Check your spam folder, or wait for the
              timer above to resend.
            </p>

            <div className="pt-4 border-t">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Back to sign in
                </button>
              ) : (
                <Link href="/login" className="text-sm text-blue-600 hover:underline">
                  Back to sign in
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
