"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { emailVerification } from "@/lib/emails/emailVerification";
import { ProfileFormSchema } from "@/components/user/update-profile-form";
import prisma from "@/lib/prisma";

export const getUserWithOAuth = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user has OAuth accounts
    const oauthAccounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        providerId: true,
      },
    });

    const hasOAuthAccounts = oauthAccounts.length > 0;

    // Check if user has password credentials (non-OAuth account)
    const hasPasswordCredentials = oauthAccounts.some(
      (account) => account.providerId === "credential"
    );

    return {
      success: true,
      user: {
        ...session.user,
        hasOAuthAccounts,
        hasPasswordCredentials,
        isOAuthOnly: hasOAuthAccounts && !hasPasswordCredentials,
      },
    };
  } catch (error) {
    console.error("getUserWithOAuth error:", error);
    return { success: false, error: "Failed to fetch user data" };
  }
};

export const updatePassword = async ({
  currentPassword,
  newPassword,
  isOAuthUser,
}: {
  currentPassword?: string;
  newPassword: string;
  isOAuthUser: boolean;
}) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user has OAuth accounts
    const oauthAccounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        providerId: true,
      },
    });

    const hasOAuthAccounts = oauthAccounts.length > 0;
    const hasPasswordCredentials = oauthAccounts.some(
      (account) => account.providerId === "credential"
    );
    const isOAuthOnly = hasOAuthAccounts && !hasPasswordCredentials;

    // Prevent OAuth-only users from adding passwords for security
    if (isOAuthOnly) {
      return {
        success: false,
        error:
          "Password management is not available for OAuth accounts. Your account is secured through your OAuth provider.",
      };
    }

    // For OAuth users adding a password, no current password needed
    if (!isOAuthUser && !currentPassword) {
      return { success: false, error: "Current password is required" };
    }

    // Update password using better-auth
    if (isOAuthUser) {
      // OAuth user adding a password - use setPassword
      await auth.api.setPassword({
        body: {
          newPassword,
        },
        headers: await headers(),
      });
    } else {
      // Regular user changing password - use changePassword
      await auth.api.changePassword({
        body: {
          currentPassword: currentPassword!,
          newPassword,
        },
        headers: await headers(),
      });
    }

    return {
      success: true,
      message: isOAuthUser
        ? "Password added successfully. You can now login with your email and password."
        : "Password updated successfully.",
    };
  } catch (error) {
    console.error("updatePassword error:", error);
    return {
      success: false,
      error:
        "Failed to update password. Please check your current password and try again.",
    };
  }
};

export const updateUserProfile = async (values: ProfileFormSchema) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const user = session.user;
    let emailChanged = false;

    // Check if user has OAuth accounts
    const oauthAccounts = await prisma.account.findMany({
      where: {
        userId: user.id,
      },
      select: {
        providerId: true,
      },
    });

    const hasOAuthAccounts = oauthAccounts.length > 0;

    // Update name if changed
    if (values.name !== user.name) {
      await auth.api.updateUser({
        body: {
          name: values.name,
        },
        headers: await headers(),
      });
    }

    // Update email if changed (only for non-OAuth users)
    if (values.email !== user.email) {
      if (hasOAuthAccounts) {
        return {
          success: false,
          error:
            "Cannot change email for OAuth accounts. Please update your email through your OAuth provider.",
        };
      }

      await auth.api.changeEmail({
        body: {
          newEmail: values.email,
        },
        headers: await headers(),
      });
      emailChanged = true;

      // Send verification email for the new email
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`;
      await emailVerification({
        user: {
          email: values.email,
          name: values.name,
        },
        url: verificationUrl,
      });
    }

    return {
      success: true,
      emailChanged,
      message: emailChanged
        ? "Profile updated successfully. Please check your new email for verification."
        : "Profile updated successfully",
    };
  } catch (error) {
    console.error("updateUserProfile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
};
