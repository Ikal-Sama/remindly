"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/prisma";
import { getSmsCarrier, normalizePhoneNumber } from "@/lib/sms/carriers";
import {
  SMS_TEST_COOLDOWN_MS,
  SMS_TEST_DAILY_LIMIT,
} from "@/lib/sms/constants";
import { testSms } from "@/lib/sms/messages";
import { getSmsProvider, isSmsConfigured, sendSms } from "@/lib/sms/sendSms";

export interface SmsSettings {
  phoneNumber: string;
  carrierId: string;
  enabled: boolean;
  provider: string;
  canDeliver: boolean;
}

interface SmsSettingsResponse {
  success: boolean;
  error?: string;
  settings?: SmsSettings;
}

interface SmsMutationResponse {
  success: boolean;
  error?: string;
  message?: string;
  settings?: Pick<SmsSettings, "phoneNumber" | "carrierId" | "enabled">;
}

async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

export async function getSmsSettings(): Promise<SmsSettingsResponse> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true, phoneCarrier: true, smsReminders: true },
    });

    return {
      success: true,
      settings: {
        phoneNumber: user?.phoneNumber ?? "",
        carrierId: user?.phoneCarrier ?? "",
        enabled: user?.smsReminders ?? false,
        provider: getSmsProvider(),
        canDeliver: isSmsConfigured(),
      },
    };
  } catch (error) {
    console.error("getSmsSettings error:", error);
    return { success: false, error: "Could not load SMS settings." };
  }
}

/**
 * Save the phone number, carrier and opt-in flag.
 *
 * The carrier is stored as an id from `lib/sms/carriers.ts`; the gateway domain
 * is resolved server-side, so a user cannot turn the SMTP account into an open
 * relay by storing an arbitrary domain.
 */
export async function updateSmsSettings(input: {
  phoneNumber: string;
  carrierId: string;
  enabled: boolean;
}): Promise<SmsMutationResponse> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const rawPhone = input.phoneNumber.trim();
    const phoneNumber = rawPhone ? normalizePhoneNumber(rawPhone) : null;

    if (rawPhone && !phoneNumber) {
      return {
        success: false,
        error: "Enter a phone number with its country code, e.g. +14155550123.",
      };
    }

    const carrierId = input.carrierId.trim() || null;
    const carrier = getSmsCarrier(carrierId);
    if (carrierId && !carrier) {
      return { success: false, error: "That mobile carrier is not supported." };
    }

    if (input.enabled && !phoneNumber) {
      return {
        success: false,
        error: "Add a phone number before turning on SMS reminders.",
      };
    }

    // Every gateway in the catalogue is North American. Rejecting other
    // numbers here is kinder than accepting them and silently dropping every
    // reminder.
    if (phoneNumber && carrier && !phoneNumber.startsWith("+1")) {
      return {
        success: false,
        error:
          "Free SMS reminders currently support US and Canadian numbers only.",
      };
    }

    if (
      input.enabled &&
      getSmsProvider() === "email-gateway" &&
      !carrier
    ) {
      return {
        success: false,
        error: "Choose your mobile carrier so we can route the message.",
      };
    }

    const enabled = input.enabled && Boolean(phoneNumber);

    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber,
        phoneCarrier: carrier?.id ?? null,
        smsReminders: enabled,
      },
    });

    return {
      success: true,
      message: "SMS settings saved.",
      settings: {
        phoneNumber: phoneNumber ?? "",
        carrierId: carrier?.id ?? "",
        enabled,
      },
    };
  } catch (error) {
    console.error("updateSmsSettings error:", error);
    return { success: false, error: "Failed to save SMS settings." };
  }
}

/**
 * Send a test message to the saved number.
 *
 * Rate limited per user (one a minute, ten a day) so the button cannot be used
 * to spray messages through the shared SMTP account.
 */
export async function sendTestSms(): Promise<SmsMutationResponse> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true, phoneCarrier: true, smsReminders: true },
    });

    if (!user?.phoneNumber) {
      return { success: false, error: "Save a phone number first." };
    }

    if (!user.smsReminders) {
      return { success: false, error: "Turn on SMS reminders and save first." };
    }

    const lastTest = await prisma.smsNotification.findFirst({
      where: { userId, type: "TEST" },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    });

    if (
      lastTest &&
      Date.now() - lastTest.sentAt.getTime() < SMS_TEST_COOLDOWN_MS
    ) {
      const seconds = Math.ceil(
        (SMS_TEST_COOLDOWN_MS - (Date.now() - lastTest.sentAt.getTime())) / 1000,
      );
      return {
        success: false,
        error: `Please wait ${seconds}s before sending another test.`,
      };
    }

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const testsToday = await prisma.smsNotification.count({
      where: { userId, type: "TEST", sentAt: { gte: startOfDay } },
    });

    if (testsToday >= SMS_TEST_DAILY_LIMIT) {
      return {
        success: false,
        error: "Daily test limit reached. Try again tomorrow.",
      };
    }

    const result = await sendSms({
      phoneNumber: user.phoneNumber,
      carrierId: user.phoneCarrier,
      message: testSms(),
    });

    await prisma.smsNotification.create({
      data: {
        userId,
        type: "TEST",
        status: result.status,
        provider: result.provider,
        error: result.error ?? null,
        scheduledFor: new Date(),
      },
    });

    if (result.status === "FAILED") {
      return {
        success: false,
        error: `The test message could not be sent: ${result.error}`,
      };
    }

    return {
      success: true,
      message:
        result.status === "LOGGED"
          ? "Test message logged. SMS delivery is not configured on this deployment."
          : "Test message sent. Check your phone in a minute.",
    };
  } catch (error) {
    console.error("sendTestSms error:", error);
    return { success: false, error: "Failed to send the test message." };
  }
}
