"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  LayoutDashboard,
  ListChecks,
  LogOut,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import {
  APP_NAV_ITEMS,
  cn,
  isAppRoute,
  type AppNavHref,
} from "@/lib/utils";

const ICONS: Record<AppNavHref, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/task": ListChecks,
  "/subscription": CreditCard,
  "/settings": UserRound,
};

/**
 * Bottom tab bar for the signed-in app on phones.
 *
 * Marketing pages keep the regular top navigation, so the bar only renders on
 * the app routes and only for a signed-in user. Content areas add their own
 * bottom padding (see the app pages) so the fixed bar never covers anything.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  if (!isAppRoute(pathname) || !session?.user?.emailVerified) return null;

  const signOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.replace("/login");
        },
      },
    });
  };

  return (
    <nav
      aria-label="App navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-md md:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch px-2 pb-[env(safe-area-inset-bottom)]">
        {APP_NAV_ITEMS.map(({ href, label }) => {
          const Icon = ICONS[href];
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-0 h-0.5 w-10 rounded-full bg-primary transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={signOut}
          className="relative flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-destructive"
        >
          <LogOut className="size-5" aria-hidden />
          Logout
        </button>
      </div>
    </nav>
  );
}
