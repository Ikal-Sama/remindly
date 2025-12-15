import { Check } from "lucide-react";

export default function PricingPage() {
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
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-background border rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground mb-4">
                Perfect for personal use
              </p>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span>Up to 10 active tasks</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span>Basic reminders</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span>Email notifications</span>
              </li>

              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span>Simple analytics</span>
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="bg-primary text-primary-foreground rounded-2xl p-8 hover:shadow-xl transition-shadow transform scale-105">
            <div className="bg-yellow-400 text-background text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
              MOST POPULAR
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-primary-foreground/80 mb-4">
                <span>For professionals</span>
              </p>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">$5</span>
                <span className="text-primary-foreground/80 ml-2">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-yellow-400 mr-3" />
                <span>Unlimited tasks</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-yellow-400 mr-3" />
                <span>Advanced reminders</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-yellow-400 mr-3" />
                <span>Multiple notification channels</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-yellow-400 mr-3" />
                <span>Task categories & labels</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-yellow-400 mr-3" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-yellow-400 mr-3" />
                <span>Detailed analytics & insights</span>
              </li>
            </ul>
          </div>
        </div>

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

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                Is there a free trial for paid plans?
              </h3>
              <p className="text-muted-foreground">
                Yes, we offer a 14-day free trial for Pro plan with full
                features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground">
                We accept all major credit cards and PayPal.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                Can I cancel my subscription?
              </h3>
              <p className="text-muted-foreground">
                Yes, you can cancel anytime. Your access continues until the end
                of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
