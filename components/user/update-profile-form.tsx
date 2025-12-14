"use client";
import { User } from "better-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { updateUserProfile } from "@/app/action/user";

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
import { toast } from "sonner";
import { useUserStore } from "@/stores/user-store";

const profileFormSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.email(),
});

export type ProfileFormSchema = z.infer<typeof profileFormSchema>;

export default function UpdateProfileForm({
  user,
}: {
  user: User & { hasOAuthAccounts?: boolean };
}) {
  const [emailSent, setEmailSent] = useState(false);
  const { updateUserProfile: updateZustandProfile } = useUserStore();

  const form = useForm<ProfileFormSchema>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
    },
  });

  async function onSubmit(values: ProfileFormSchema) {
    const result = await updateUserProfile(values);

    if (result.success) {
      toast.success(result.message);

      // Update the Zustand store with the new name
      updateZustandProfile({ name: values.name });

      if (result.emailChanged) {
        setEmailSent(true);
      }
    } else {
      toast.error(result.error || "Error updating profile");
    }
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 w-full max-w-lg"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
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
                  placeholder="Enter your email"
                  {...field}
                  disabled={user.hasOAuthAccounts}
                />
              </FormControl>
              <FormDescription>
                {user.hasOAuthAccounts
                  ? "Email is managed by your OAuth provider and cannot be changed here."
                  : "Changing your email will send a verification link to the new address."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {emailSent && (
          <div className="text-sm text-green-600">
            Verification email sent! Please check your inbox.
          </div>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
