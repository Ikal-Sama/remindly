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

export default function HomePage() {
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
      {/* APK Download Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">Bring Remindly to Your Phone</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Install the app on your Android device for a native experience with push notifications and offline support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="default"
              className="px-8"
            >
              Download APK (4.2 MB)
            </Button>
            <a
              href="https://play.google.com/store/apps/search?q=Remindly"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 14c1.49-1.46 1.49-3.85 0-5.32l-7.54 7.46 7.54-7.45L19 14zM17 3H7a5 5 0 0 0-5 5v14c0 2.21 3.58 4.41 8 5v-2c-3.07-1.32-3.88-2.64-3.98-3.07L7 22H2v-2h15v2c0 1.1.9 2 2 2h4c0-1.5-1.05-2.72-2.5-3.23L17 3zm-4 10.16l-1.63-1.61L12 14.1l1.62 1.61 1.72-1.71L17 11.89l-2.92 2.3L12 14.1l2.91-2.31L12 14.1z" />
              </svg>
              Get it on Google Play
            </a>
            <p className="text-sm text-gray-500 mt-4">
              <strong>File size:</strong> 4.2 MB
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
