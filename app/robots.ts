export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/dashboard", "/welcome"],
    },
    sitemap: `${
      process.env.NEXT_PUBLIC_APP_URL || "https://remindly-pi.vercel.app"
    }/sitemap.xml`,
  };
}
