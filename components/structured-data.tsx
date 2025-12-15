export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Remindly",
    description:
      "Smart task reminder app with intelligent email notifications and deadline management",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://remindly-pi.vercel.app",
    applicationCategory: "Productivity",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Free Plan",
        price: "0",
        priceCurrency: "USD",
        description: "Basic task management with up to 10 tasks",
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "5",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "5",
          priceCurrency: "USD",
          billingDuration: "P1M",
        },
        description: "Unlimited tasks, custom reminders, and advanced features",
      },
    ],
    featureList: [
      "Task Management",
      "Email Reminders",
      "Custom Notifications",
      "Deadline Tracking",
      "Unlimited Tasks (Pro)",
      "Priority Support (Pro)",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "150",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
