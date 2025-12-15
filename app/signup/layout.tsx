import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Remindly | Start Managing Your Tasks Today",
  description:
    "Create your free Remindly account and start organizing your tasks with intelligent reminders. Get email notifications, custom deadlines, and seamless task management.",
  keywords: [
    "sign up",
    "register",
    "task management",
    "reminder app",
    "productivity",
  ],
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
