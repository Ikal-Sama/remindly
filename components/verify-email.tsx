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
import { Label } from "@/components/ui/label";
import { LoadingSwap } from "./loading-swap";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import Link from "next/link";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;
const emptyDigits = () => Array<string>(OTP_LENGTH).fill("");

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
  const [digits, setDigits] = useState<string[]>(emptyDigits);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeToNextResend, setTimeToNextResend] = useState(
    RESEND_COOLDOWN_SECONDS
  );
  const interval = useRef<NodeJS.Timeout>(undefined);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const code = digits.join("");

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

  const focusBox = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  /** Spread `text` across the boxes starting at `start`, truncating overflow. */
  const distribute = (text: string, start: number) => {
    const next = [...digits];
    let lastFilled = start;

    for (let i = 0; i < text.length && start + i < OTP_LENGTH; i++) {
      next[start + i] = text[i];
      lastFilled = start + i;
    }

    setDigits(next);
    focusBox(Math.min(lastFilled + 1, OTP_LENGTH - 1));
  };

  const handleChange = (index: number, raw: string) => {
    const numeric = raw.replace(/\D/g, "");

    if (!numeric) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    // More than one digit means the whole code arrived at once - iOS SMS
    // autofill drops the entire code into a single box, and a paste that
    // slipped past onPaste behaves the same way. Always fill from the first
    // box: autofill can target any box, and spreading from the middle would
    // leave the leading boxes empty and the code incomplete.
    if (numeric.length > 1) {
      distribute(numeric, 0);
      return;
    }

    const next = [...digits];
    next[index] = numeric;
    setDigits(next);

    if (index < OTP_LENGTH - 1) {
      focusBox(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    // Pasting means "use this code", so it replaces from the first box rather
    // than appending at the caret - otherwise a paste over partially typed
    // digits silently submits the wrong code.
    distribute(pasted, 0);
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        // Empty box: clear and step back rather than doing nothing.
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        focusBox(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handleVerify = async () => {
    if (!email) {
      toast.error("Email address is required");
      return;
    }

    if (code.length !== OTP_LENGTH) {
      toast.error(`Enter the ${OTP_LENGTH}-digit code from your email`);
      return;
    }

    setIsVerifying(true);

    try {
      const res = await authClient.emailOtp.verifyEmail({ email, otp: code });

      if (res.error) {
        toast.error(res.error.message || "That code is not valid");
        setDigits(emptyDigits());
        focusBox(0);
        return;
      }

      toast.success("Email verified!");

      // Verification is not a page load, unlike the old link flow, so nothing
      // would re-read the session on its own. Refresh so server components
      // pick up emailVerified, or let the caller decide where to go.
      if (onVerified) {
        onVerified();
      } else {
        router.refresh();
      }
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

  const canVerify = code.length === OTP_LENGTH && !isVerifying;

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
              <Label htmlFor="verification-code-0" className="sr-only">
                Verification code
              </Label>

              <div className="flex justify-center gap-2" role="group">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    id={`verification-code-${index}`}
                    value={digit}
                    onChange={(event) => handleChange(index, event.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    type="text"
                    inputMode="numeric"
                    // Only the first box carries the autofill hint; iOS uses it
                    // to offer the code from Messages above the keyboard.
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                    disabled={isVerifying}
                    className="h-12 w-12 rounded-md border border-input bg-background text-center text-xl font-mono shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
                  />
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleVerify} disabled={!canVerify}>
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
                <Link
                  href="/login"
                  className="text-sm text-blue-600 hover:underline"
                >
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
