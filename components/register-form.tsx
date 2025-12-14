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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Field, FieldDescription } from "./ui/field";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoadingSwap } from "./loading-swap";
import SocialAuthButton from "./social-auth-button";
import { VerifyEmail } from "./verify-email";

export const registerFormSchema = z
  .object({
    name: z.string().min(2, "Name is required").max(50),
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    passwordConfirmation: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ["passwordConfirmation"],
  });

export function RegisterForm({
  className,
  openEmailVerification,
  ...props
}: React.ComponentProps<"div"> & {
  openEmailVerification?: (email: string) => void;
}) {
  const router = useRouter();
  const [showVerification, setShowVerification] = useState(false);
  const [email, setEmail] = useState("");
  const form = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof registerFormSchema>) {
    const res = await authClient.signUp.email(
      { ...values, callbackURL: "/dashboard" },
      {
        onError: (err) => {
          toast.error(err.error.message || "Failed to sign up.");
        },
      }
    );

    if (res.error == null && res.data) {
      // If email is NOT verified, show email verification
      if (!res.data.user.emailVerified) {
        setEmail(values.email);
        setShowVerification(true);
      } else {
        // If email is already verified, go to dashboard
        router.push("/dashboard");
      }
    }
  }

  if (showVerification) {
    return <VerifyEmail email={email} />;
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            fill up the form below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="example" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Min 8 characters"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passwordConfirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Min 8 characters"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <LoadingSwap isLoading={isSubmitting}>
                    Create an account
                  </LoadingSwap>
                </Button>
                <SocialAuthButton provider="google" fullWidth />
                <FieldDescription className="text-center">
                  Already have an account? <a href="/login">Sign in</a>
                </FieldDescription>
              </Field>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
