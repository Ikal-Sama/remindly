import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Remindly | Access Your Task Dashboard",
  description:
    "Sign in to your Remindly account to manage your tasks, view deadlines, and access your intelligent reminder system.",
  keywords: [
    "login",
    "sign in",
    "task management",
    "dashboard",
    "reminder app",
  ],
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
