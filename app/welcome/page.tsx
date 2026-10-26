import type { Metadata } from "next";
import { WelcomeScreen } from "@/components/welcome-screen";

export const metadata: Metadata = {
  title: "Welcome - Remindly",
  description: "Sign in to Remindly or create a free account.",
  // App-only screen: browsers are redirected away by the proxy.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <WelcomeScreen />;
}
