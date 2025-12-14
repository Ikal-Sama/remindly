"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfileImageUpload } from "@/components/user/profile-image-upload";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UpdateProfileForm from "@/components/user/update-profile-form";
import { getUserWithOAuth } from "@/app/action/user";
import UpdatePasswordForm from "@/components/user/update-password-form";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/auth-client";
import SubscriptionHistory from "@/components/user/subscription-history";
import { useUserStore } from "@/stores/user-store";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { userProfile, setUserProfile } = useUserStore();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push("/login");
    }
  }, [session, sessionLoading, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session) return; // Don't fetch if not authenticated

      const result = await getUserWithOAuth();
      if (result.success && result.user) {
        setUserData(result.user);
        // Initialize the Zustand store with the fetched data
        setUserProfile({
          id: result.user.id,
          name: result.user.name || "",
          email: result.user.email,
          image: result.user.image || null,
        });
      }
      setLoading(false);
    };

    if (!sessionLoading && session) {
      fetchUserData();
    } else if (!sessionLoading && !session) {
      setLoading(false);
    }
  }, [session, sessionLoading, setUserProfile]);

  // Sync local state with user data when it changes
  useEffect(() => {
    if (userData) {
      setUserProfile({
        id: userData.id,
        name: userData.name || "",
        email: userData.email,
        image: userData.image || null,
      });
    }
  }, [userData, setUserProfile]);

  const handleImageUpdate = (imageUrl: string) => {
    // Just update the Zustand store - database is handled in the upload component
    const currentProfile = userProfile;
    if (currentProfile) {
      setUserProfile({ ...currentProfile, image: imageUrl });
    }
  };

  if (loading || sessionLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-10">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and billing information.
        </p>
      </div>

      <div className="mt-8 md:mt-16 w-full">
        <Tabs defaultValue="profile">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-20">
            <TabsList className="flex flex-row lg:flex-col h-fit w-full lg:w-64 items-start">
              <TabsTrigger value="profile" className="w-full justify-start">
                <span className="hidden lg:inline">Profile</span>
                <span className="lg:hidden">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="password" className="w-full justify-start">
                <span className="hidden lg:inline">Password</span>
                <span className="lg:hidden">Password</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="w-full justify-start">
                <span className="hidden lg:inline">Billing</span>
                <span className="lg:hidden">Billing</span>
              </TabsTrigger>
            </TabsList>

            <div className="w-full ">
              <TabsContent value="profile" className="space-y-6">
                <div className="flex flex-col items-center justify-center px-2">
                  <ProfileImageUpload
                    currentImage={userProfile?.image ?? undefined}
                    userName={userProfile?.name}
                    onImageUpdate={handleImageUpdate}
                  />
                  <div className="text-center mt-5">
                    <h1 className="text-xl md:text-2xl font-bold text-accent-foreground">
                      {userProfile?.name}
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                      {userProfile?.email}
                    </p>
                  </div>

                  <div className="mt-5 w-full max-w-md">
                    {userData && <UpdateProfileForm user={userData} />}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="password" className="space-y-6">
                <div className="flex flex-col items-center justify-center px-2">
                  <h2 className="text-lg md:text-xl font-semibold text-center">
                    Password Settings
                  </h2>
                  <p className="text-muted-foreground text-center text-sm md:text-base">
                    Change your password and manage security settings.
                  </p>

                  <div className="mt-5 w-full max-w-md">
                    <Card>
                      <CardContent className="p-4 md:p-6">
                        <UpdatePasswordForm
                          isOAuthOnly={userData?.isOAuthOnly}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                <div className="px-2">
                  <h2 className="text-lg md:text-xl font-semibold">
                    Billing Information
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Manage your subscription, payment methods, and billing
                    history.
                  </p>

                  <div className="mt-5">
                    <SubscriptionHistory />
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
