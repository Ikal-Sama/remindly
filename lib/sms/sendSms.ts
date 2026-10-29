import { sendPlainEmail } from "@/lib/emails/sendEmail";
import { toGatewayAddress } from "./carriers";

/**
 * How SMS is delivered.
 *
 * - `email-gateway` (default): free, through the existing SMTP account using
 *   the carrier's email-to-SMS bridge. US/Canada only, best-effort.
 * - `console`: prints the message and records it as `LOGGED`. Useful in
 *   development, or on a deployment with no SMTP credentials.
 *
 * Adding a real provider later means adding a branch here and a value to
 * `SMS_PROVIDER`; nothing else in the feature needs to change.
 */
export type SmsProvider = "email-gateway" | "console";
export type SmsStatus = "SENT" | "FAILED" | "LOGGED";

export interface SmsResult {
  provider: SmsProvider;
  status: SmsStatus;
  error?: string;
}

export function getSmsProvider(): SmsProvider {
  return process.env.SMS_PROVIDER === "console" ? "console" : "email-gateway";
}

/** Whether the chosen transport can actually deliver anything right now. */
export function isSmsConfigured(): boolean {
  if (getSmsProvider() === "console") return true;
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

interface SendSmsInput {
  phoneNumber: string;
  carrierId: string | null | undefined;
  message: string;
}

/**
 * Send one SMS. Never throws: callers log the result and move on, so a broken
 * gateway cannot fail a reminder run.
 */
export async function sendSms({
  phoneNumber,
  carrierId,
  message,
}: SendSmsInput): Promise<SmsResult> {
  const provider = getSmsProvider();

  if (provider === "console") {
    console.info(`[sms:console] ${maskPhoneNumber(phoneNumber)}: ${message}`);
    return { provider, status: "LOGGED" };
  }

  const address = toGatewayAddress(phoneNumber, carrierId);
  if (!address) {
    return {
      provider,
      status: "FAILED",
      error: "No email-to-SMS gateway for this number and carrier.",
    };
  }

  try {
    // The carrier bridge ignores the subject and uses the plain-text body.
    await sendPlainEmail({ to: address, subject: "Remindly", text: message });
    return { provider, status: "SENT" };
  } catch (error) {
    return {
      provider,
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown SMTP error",
    };
  }
}

function maskPhoneNumber(phoneNumber: string): string {
  return phoneNumber.length > 4
    ? `${phoneNumber.slice(0, 2)}***${phoneNumber.slice(-4)}`
    : "***";
}
