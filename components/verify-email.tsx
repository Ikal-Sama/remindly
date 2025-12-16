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
import { LoadingSwap } from "./loading-swap";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function VerifyEmail({
  email,
  className,
  onBack,
  ...props
}: React.ComponentProps<"div"> & {
  email: string;
  onBack?: () => void;
}) {
  const [isResending, setIsResending] = useState(false);
  const [timeToNextResend, setTimeToNextResend] = useState(30);
  const interval = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    startEmailVerificationCountdown();
  }, []);

  async function handleResendVerification() {
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
      const res = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/choose-plan",
      });

      if (res.error) {
        toast.error(res.error.message || "Failed to resend verification email");
      } else {
        toast.success("Verification email sent successfully!");
        startEmailVerificationCountdown(); // Restart countdown after successful send
      }
    } catch (error) {
      toast.error("An error occurred while resending the verification email");
    } finally {
      setIsResending(false);
    }
  }

  function startEmailVerificationCountdown(time = 30) {
    setTimeToNextResend(time);

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

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent you a verification link. Please check your email and click
            the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              {email && `Verification email sent to: ${email}`}
            </div>

            <Button
              variant="outline"
              onClick={handleResendVerification}
              disabled={isResending || timeToNextResend > 0}
              className="w-full"
            >
              <LoadingSwap isLoading={isResending}>
                {timeToNextResend > 0
                  ? `Resend in ${timeToNextResend}s`
                  : "Resend verification email"}
              </LoadingSwap>
            </Button>

            <div className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try resending.
            </div>

            <div className="pt-4 border-t">
              {onBack ? (
                <button
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
