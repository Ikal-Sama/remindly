import { sendEmail } from "./sendEmail";

type OtpType = "sign-in" | "email-verification" | "forget-password" | "change-email";

interface EmailOtpParams {
  email: string;
  name?: string;
  otp: string;
  type: OtpType;
  /** Minutes the code stays valid. Kept in step with the plugin's `expiresIn`. */
  expiresInMinutes?: number;
}

const COPY: Record<OtpType, { subject: string; title: string; message: string }> =
  {
    "sign-in": {
      subject: "Your sign-in code",
      title: "Sign-in code",
      message:
        "Use the code below to sign in. If you did not try to sign in, you can ignore this email.",
    },
    "email-verification": {
      subject: "Verify your email address",
      title: "Verify your email address",
      message:
        "Thank you for signing up! Enter this code to verify your email address and activate your account.",
    },
    "forget-password": {
      subject: "Your password reset code",
      title: "Password reset code",
      message:
        "Use the code below to choose a new password. If you did not request this, you can ignore this email.",
    },
    "change-email": {
      subject: "Confirm your new email address",
      title: "Confirm your new email address",
      message:
        "Use the code below to confirm this address as your new login email.",
    },
  };

/**
 * Sends a one-time code for a given purpose.
 *
 * The code is rendered as spaced digits so it is easy to read off a phone,
 * and the raw digits are kept in the accessible label for screen readers.
 */
export async function sendEmailOtp({
  email,
  name,
  otp,
  type,
  expiresInMinutes = 10,
}: EmailOtpParams) {
  const copy = COPY[type];
  const spaced = otp.split("").join(" ");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">${copy.title}</h2>
      <p style="color: #666; margin-bottom: 20px;">Hi ${
        name || "there"
      },</p>
      <p style="color: #666; margin-bottom: 30px; line-height: 1.5;">${
        copy.message
      }</p>

      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; padding: 18px 28px; background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 6px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333; font-family: 'Courier New', monospace;">${spaced}</span>
        </div>
      </div>

      <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
        This code expires in ${expiresInMinutes} minutes and can only be used once.
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        If you did not request this code, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: copy.subject,
    html,
  });
}
