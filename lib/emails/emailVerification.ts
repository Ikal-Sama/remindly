import { sendEmail, createEmailTemplate } from "./sendEmail";

interface EmailVerificationParams {
  user: {
    email: string;
    name?: string;
  };
  url: string;
}

export async function emailVerification({
  user,
  url,
}: EmailVerificationParams) {
  const html = createEmailTemplate(user, {
    title: "Verify your email address",
    greeting: `Hi ${user.name || "there"},`,
    message:
      "Thank you for signing up! Please click the button below to verify your email address and activate your account.",
    buttonText: "Verify Email Address",
    buttonUrl: url,
    footerText:
      "This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.",
  });

  await sendEmail({
    to: user.email,
    subject: "Verify your email address",
    html,
  });
}
