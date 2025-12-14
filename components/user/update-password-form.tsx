"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { updatePassword } from "@/app/action/user";

import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

const getPasswordFormSchema = (isOAuthUser?: boolean) =>
  z
    .object({
      currentPassword: isOAuthUser
        ? z.string().optional()
        : z.string().min(1, "Current password is required"),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z
        .string()
        .min(8, "Password must be at least 8 characters"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });

export type PasswordFormSchema = z.infer<
  ReturnType<typeof getPasswordFormSchema>
>;

export default function UpdatePasswordForm({
  isOAuthOnly,
}: {
  isOAuthOnly?: boolean;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Don't allow OAuth users to add passwords for security
  if (isOAuthOnly) {
    return (
      <div className="space-y-4">
        <div className="text-center p-6 border rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium mb-2">Password Management</h3>
          <p className="text-muted-foreground text-sm">
            Password management is not available for OAuth accounts. Your
            account is secured through your OAuth provider.
          </p>
        </div>
      </div>
    );
  }

  const form = useForm<PasswordFormSchema>({
    resolver: zodResolver(getPasswordFormSchema(isOAuthOnly)),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: PasswordFormSchema) {
    setIsUpdating(true);

    const result = await updatePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      isOAuthUser: isOAuthOnly || false,
    });

    if (result.success) {
      toast.success(result.message);
      form.reset();
    } else {
      toast.error(result.error || "Error updating password");
    }

    setIsUpdating(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {!isOAuthOnly && (
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Enter current password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="Enter new password" {...field} />
              </FormControl>
              <FormDescription>
                Password must be at least 8 characters long.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="Confirm new password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isUpdating}>
            {isUpdating
              ? "Updating..."
              : isOAuthOnly
              ? "Add Password"
              : "Update Password"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
