"use cache";

import PricingCards from "@/components/shared/pricing-cards";

export default async function PricingPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your needs. Start free and upgrade as
            you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards />

        {/* Feature Comparison */}
        <div className="mt-20 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Feature Comparison
          </h2>
          <div className="bg-background border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Feature</th>
                  <th className="text-center p-4">Free</th>
                  <th className="text-center p-4">Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">Active Tasks</td>
                  <td className="text-center p-4">10</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Reminder Types</td>
                  <td className="text-center p-4">Basic</td>
                  <td className="text-center p-4">Advanced</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Notifications</td>
                  <td className="text-center p-4">Email</td>
                  <td className="text-center p-4">Multiple</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Support</td>
                  <td className="text-center p-4">Community</td>
                  <td className="text-center p-4">Priority</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
