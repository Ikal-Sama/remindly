import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface EmailUser {
  email: string;
  name?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailParams) {
  const mailOptions = {
    from: from || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    to,
    subject,
    html,
    priority: "high" as const,
    headers: {
      "X-Priority": "1",
      "X-MSMail-Priority": "High",
      Importance: "high",
    },
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to: ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export function createEmailTemplate(
  user: EmailUser,
  content: {
    title: string;
    greeting?: string;
    message: string;
    buttonText: string;
    buttonUrl: string;
    footerText?: string;
  }
) {
  const { title, greeting, message, buttonText, buttonUrl, footerText } =
    content;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">${title}</h2>
      <p style="color: #666; margin-bottom: 20px;">${
        greeting || `Hi ${user.name || "there"},`
      }</p>
      <p style="color: #666; margin-bottom: 30px; line-height: 1.5;">${message}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${buttonUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          ${buttonText}
        </a>
      </div>
      <p style="color: #666; font-size: 14px; margin-bottom: 10px;">Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666; font-size: 14px; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">${buttonUrl}</p>
      ${
        footerText
          ? `<p style="color: #999; font-size: 12px; margin-top: 30px;">${footerText}</p>`
          : ""
      }
    </div>
  `;
}
