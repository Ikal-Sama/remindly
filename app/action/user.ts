"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { emailVerification } from "@/lib/emails/emailVerification";
import { ProfileFormSchema } from "@/components/user/update-profile-form";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const getUserWithOAuth = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user has OAuth accounts (excluding credential provider)
    const oauthAccounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
        providerId: {
          not: "credential", // Exclude credential provider
        },
      },
      select: {
        providerId: true,
      },
    });

    const hasOAuthAccounts = oauthAccounts.length > 0;

    // Check if user has password credentials (non-OAuth account)
    const hasPasswordCredentials = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "credential",
      },
    });

    return {
      success: true,
      user: {
        ...session.user,
        hasOAuthAccounts,
        hasPasswordCredentials: !!hasPasswordCredentials,
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

/**
 * Permanently delete the signed-in user's account.
 *
 * The session is re-derived from the request headers here and the user id is
 * never taken from the client, so this cannot be used to delete someone else's
 * account.
 *
 * Stripe subscriptions are cancelled first: deleting the local rows alone would
 * leave a paying customer being billed for a plan they no longer have. A
 * failure there is logged but does not block deletion - the user asked for the
 * account to go, and a stale Stripe subscription can be reconciled later,
 * whereas trapping them in a half-deleted state cannot.
 *
 * Deleting the User cascades to sessions, accounts, tasks, task labels,
 * categories, labels and subscriptions, and tasks cascade to email
 * notifications.
 */
export const deleteAccount = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    const paidSubscriptions = await prisma.userSubscription.findMany({
      where: {
        userId,
        stripeSubscriptionId: { not: null },
      },
      select: { stripeSubscriptionId: true },
    });

    for (const { stripeSubscriptionId } of paidSubscriptions) {
      if (!stripeSubscriptionId) continue;
      try {
        await stripe.subscriptions.cancel(stripeSubscriptionId);
      } catch (error) {
        console.error(
          `deleteAccount: failed to cancel Stripe subscription ${stripeSubscriptionId}:`,
          error,
        );
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    return { success: true };
  } catch (error) {
    console.error("deleteAccount error:", error);
    return {
      success: false,
      error: "Failed to delete your account. Please try again.",
    };
  }
};
