import { sendEmail, createEmailTemplate } from "./sendEmail";

interface ResetPasswordEmailParams {
  user: {
    email: string;
    name?: string;
  };
  url: string;
}

export async function sendResetPasswordEmail({
  user,
  url,
}: ResetPasswordEmailParams) {
  const html = createEmailTemplate(user, {
    title: "Reset your password",
    greeting: `Hi ${user.name || "there"},`,
    message:
      "You recently requested to reset your password. Click the button below to set a new password.",
    buttonText: "Reset Password",
    buttonUrl: url,
    footerText:
      "This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have questions.",
  });

  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    html,
  });
}
