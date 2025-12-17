"use cache";

import { Check } from "lucide-react";

export default async function PricingCards() {
  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {/* Free Plan */}
      <div className="bg-background border rounded-2xl p-8 hover:shadow-lg transition-shadow">
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-2">Free</h3>
          <p className="text-muted-foreground mb-4">Perfect for personal use</p>
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
  );
}
