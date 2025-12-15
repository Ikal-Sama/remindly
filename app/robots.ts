export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/dashboard"],
    },
    sitemap: `${
      process.env.NEXT_PUBLIC_APP_URL || "https://remindly-pi.vercel.app"
    }/sitemap.xml`,
  };
}
