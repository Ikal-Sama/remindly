import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose Your Plan - Remindly | Free & Pro Subscription Options",
  description:
    "Select the perfect Remindly plan for your needs. Free plan with basic task management or Pro plan with unlimited tasks, custom reminders, and advanced features.",
  keywords: [
    "pricing",
    "subscription",
    "plans",
    "free",
    "pro",
    "task management",
    "productivity",
  ],
};

export default function ChoosePlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
