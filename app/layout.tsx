import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/shared/navbar";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/shared/footer";
import StructuredData from "@/components/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Remindly - Smart Task Reminder App",
  description:
    "Never miss a deadline again. Remindly helps you manage tasks with intelligent email reminders, custom notifications, and seamless task tracking. Stay organized and productive with our powerful reminder system.",
  keywords: [
    "task reminder",
    "todo app",
    "task management",
    "email reminders",
    "productivity",
    "deadline tracker",
    "task scheduler",
  ],
  authors: [{ name: "Remindly Team" }],
  creator: "Remindly",
  publisher: "Remindly",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://remindly-pi.vercel.app"
  ),
  openGraph: {
    title: "Remindly - Smart Task Reminder App",
    description:
      "Never miss a deadline again. Manage tasks with intelligent email reminders and custom notifications.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://remindly-pi.vercel.app",
    siteName: "Remindly",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Remindly - Smart Task Reminder App",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Remindly - Smart Task Reminder App",
    description:
      "Never miss a deadline again. Manage tasks with intelligent email reminders.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="max-w-screen mx-auto  py-4">
            <Navbar />
            <main className="min-h-screen  mx-auto py-10">{children}</main>
            <Toaster richColors />
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
