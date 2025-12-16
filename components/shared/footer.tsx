"use client";

import { Mail, Facebook, Instagram, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Audiowide } from "next/font/google";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

const audiowide = Audiowide({
  weight: "400",
  subsets: ["latin"],
});

export function Footer() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const logoSrc =
    mounted && currentTheme === "dark" ? "/logo-light.png" : "/logo-dark.png";

  return (
    <footer className="bg-muted/30 border-t z-50">
      <div className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <img src={logoSrc} alt="Remindly" className="h-8 w-auto" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Your smart task reminder app that helps you stay organized and
              productive.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a
                  href="mailto:contact@example.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  remindly.business@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">+63 97237298</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  123 Business St, City, State 12345
                </span>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Follow Us</h3>
            <div className="flex flex-col space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start group hover:bg-primary hover:text-primary-foreground transition-colors"
                asChild
              >
                <a href="mailto:contact@example.com">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Us
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start group hover:bg-blue-600! hover:text-white! hover:border-blue-600! transition-all duration-200 dark:hover:bg-blue-600! dark:hover:text-white! dark:hover:border-blue-600!"
                asChild
              >
                <a
                  href="https://www.facebook.com/danieljhon.bancale.2025"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start group hover:bg-linear-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white transition-all"
                asChild
              >
                <a
                  href="https://instagram.com/yourprofile"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2025 Remindly. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a
                href="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
