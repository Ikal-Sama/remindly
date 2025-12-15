"use client";

import SubscriptionsPlan from "@/components/shared/subs-plan";
import { Button } from "@/components/ui/button";
import Aurora from "@/components/Aurora.jsx";
import "@/components/Aurora.css";
import Image from "next/image";
import { authClient } from "@/lib/auth/auth-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Note: In client components, metadata should be handled at the page level
// For full SEO, consider converting to server component or using generateMetadata

export default function page() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        setIsAuthenticated(!!session.data?.user);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="relative">
      <Aurora />
      <section className="text-center py-20 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6  bg-clip-text ">
            The Task Reminder
          </h1>
          <p className="text-sm md:text-lg  mb-8 max-w-2xl mx-auto">
            Create tasks, set smart reminders, and track your progress all in
            one place. Get timely notifications, organize tasks by priority, and
            never miss important deadlines again.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="px-8"
              onClick={handleGetStarted}
              disabled={isLoading}
            >
              {isLoading
                ? "Loading..."
                : isAuthenticated
                ? "Go to Dashboard"
                : "Get Started"}
            </Button>
            <Button size="lg" variant="ghost" className="px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="relative w-full h-64 md:h-96 lg:h-128 max-w-6xl mx-auto">
          <Image
            src="/images/dashboard.png"
            alt="dashboard"
            fill
            className="object-contain object-center rounded-lg"
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 relative z-10">
        <SubscriptionsPlan />
      </section>
    </div>
  );
}
