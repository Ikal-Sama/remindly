"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

const FEATURES = [
  "Organize tasks with due dates",
  "Get email reminders before deadlines",
  "Track your progress at a glance",
];

/**
 * First screen of the native app. The proxy sends the shell here when there is
 * no session, and to the dashboard when there is one, so this screen is never
 * reached by a signed-in user - and never shown on the website.
 */
export function WelcomeScreen() {
  const { theme, systemTheme } = useTheme();
  const mounted = useMounted();

  const currentTheme = theme === "system" ? systemTheme : theme;
  const logoSrc =
    mounted && currentTheme === "dark" ? "/logo-light.png" : "/logo-dark.png";

  return (
    // The root layout adds 2.5rem of main padding; cancel it so the screen
    // fills exactly one viewport.
    <div className="-my-10 flex min-h-[calc(100svh-2rem)] flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm text-center">
        <Image
          src={logoSrc}
          alt="Remindly"
          width={160}
          height={44}
          className="mx-auto h-10 w-auto"
          priority
        />

        <h1 className="mt-10 text-2xl font-bold tracking-tight">
          Welcome to Remindly
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Create tasks, get reminded before the deadline, and keep everything in
          one place.
        </p>

        <ul className="mx-auto mt-8 max-w-xs space-y-3 text-left text-sm">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 space-y-3">
          <Button size="lg" className="h-12 w-full text-base" asChild>
            <Link href="/signup">Create a free account</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-full text-base"
            asChild
          >
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Free to start. No credit card required.
        </p>
      </div>
    </div>
  );
}
