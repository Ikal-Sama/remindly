"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { authClient } from "@/lib/auth/auth-client";
import Image from "next/image";
import ActionButton from "../action-button";
import ActionButtonSimple from "../action-button-simple";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/stores/user-store";

export default function Profile() {
  const { data: session } = authClient.useSession();
  const { userProfile } = useUserStore();

  // Use userProfile context if available, fallback to session data
  const displayName = userProfile?.name || session?.user?.name || "";
  const displayImage =
    userProfile?.image || session?.user?.image || "/profile-picture.png";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative w-8 h-8 rounded-full">
          <Image
            src={displayImage}
            alt={displayName}
            fill
            className="rounded-full border border-gray-200"
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={8}
        align="end"
        className="
          w-48 
          rounded-xl 
          p-2 
          shadow-lg 
          border 
          bg-popover 
          text-popover-foreground
        "
      >
        <DropdownMenuLabel className="text-xs font-medium opacity-70 px-2 py-1">
          My Account
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <Link href="/settings">
          <DropdownMenuItem className="rounded-md px-2 py-2 cursor-pointer transition-all hover:bg-accent">
            Settings
          </DropdownMenuItem>
        </Link>

        <Link href="/subscription">
          <DropdownMenuItem className="rounded-md px-2 py-2 cursor-pointer transition-all hover:bg-accent">
            Subscription
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/login";
                },
              },
            })
          }
          className="rounded-md px-2 py-2 cursor-pointer transition-all hover:bg-accent"
        >
          Logout <LogOut className="w-4 h-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
