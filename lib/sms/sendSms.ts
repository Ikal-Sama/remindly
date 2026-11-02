import { sendPlainEmail } from "@/lib/emails/sendEmail";
import { toGatewayAddress } from "./carriers";

/**
 * How SMS is delivered.
 *
 * - `email-gateway` (default): free, through the existing SMTP account using
 *   the carrier's email-to-SMS bridge. US/Canada only, best-effort.
 * - `textbee`: an open-source Android gateway. The message is relayed to a
 *   phone you control, which sends it from its own SIM - so any number the
 *   SIM's carrier can reach works, including Philippine numbers.
 * - `console`: prints the message and records it as `LOGGED`. Useful in
 *   development, or on a deployment with no credentials.
 *
 * Adding another provider means adding a branch here and a value to
 * `SMS_PROVIDER`; nothing else in the feature needs to change.
 */
export type SmsProvider = "email-gateway" | "textbee" | "console";
export type SmsStatus = "SENT" | "FAILED" | "LOGGED";

export interface SmsResult {
  provider: SmsProvider;
  status: SmsStatus;
  error?: string;
}

const TEXTBEE_DEFAULT_URL = "https://api.textbee.dev/api/v1/gateway/send-sms";

export function getSmsProvider(): SmsProvider {
  const configured = process.env.SMS_PROVIDER;
  if (configured === "console") return "console";
  if (configured === "textbee") return "textbee";
  return "email-gateway";
}

/** Whether the chosen transport can actually deliver anything right now. */
export function isSmsConfigured(): boolean {
  const provider = getSmsProvider();
  if (provider === "console") return true;
  if (provider === "textbee") return Boolean(process.env.TEXTBEE_API_KEY);
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

  if (provider === "textbee") {
    return sendViaTextbee(phoneNumber, message);
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

/**
 * TextBee relays the message to the Android gateway app, which sends it from
 * its own SIM. The API key is server-only; the phone is never exposed.
 */
async function sendViaTextbee(
  phoneNumber: string,
  message: string
): Promise<SmsResult> {
  const apiKey = process.env.TEXTBEE_API_KEY;
  const url = process.env.TEXTBEE_API_URL || TEXTBEE_DEFAULT_URL;

  if (!apiKey) {
    return {
      provider: "textbee",
      status: "FAILED",
      error: "TEXTBEE_API_KEY is not configured.",
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipients: [phoneNumber], message }),
      // A hung gateway must not stall the whole reminder cron.
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        provider: "textbee",
        status: "FAILED",
        error: `TextBee ${response.status}: ${truncate(body, 300)}`,
      };
    }

    return { provider: "textbee", status: "SENT" };
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return {
      provider: "textbee",
      status: "FAILED",
      error: isTimeout
        ? "TextBee request timed out."
        : error instanceof Error
          ? error.message
          : "Unknown TextBee error",
    };
  }
}

function truncate(value: string, max: number): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max - 1)}…` : compact;
}

function maskPhoneNumber(phoneNumber: string): string {
  return phoneNumber.length > 4
    ? `${phoneNumber.slice(0, 2)}***${phoneNumber.slice(-4)}`
    : "***";
}
