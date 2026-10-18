import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Top-level since Next.js 16; the `experimental.` prefix is deprecated and
  // logs a warning on every build.
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
