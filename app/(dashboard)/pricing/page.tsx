import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { SubmitButton } from './submit-button';

const PLANS = [
  {
    name: 'Base',
    price: 800, // $8.00 in cents
    interval: 'month',
    trialDays: 7,
    features: [
      'Unlimited Usage',
      'Unlimited Workspace Members',
      'Email Support',
    ],
  },
  {
    name: 'Plus',
    price: 1200, // $12.00 in cents
    interval: 'month',
    trialDays: 7,
    features: [
      'Everything in Base, and:',
      'Early Access to New Features',
      '24/7 Support + Slack Access',
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Simple pricing for teams of all sizes
        </p>
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4 max-w-2xl mx-auto">
          <p className="text-yellow-800 text-sm">
            <strong>Demo Payment System:</strong> This uses a dummy payment processor for demonstration purposes only.
          </p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
        {PLANS.map((plan) => (
          <PricingCard
            key={plan.name}
            name={plan.name}
            price={plan.price}
            interval={plan.interval}
            trialDays={plan.trialDays}
            features={plan.features}
          />
        ))}
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
}) {
  return (
    <div className="pt-6">
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        with {trialDays} day free trial
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        ${price / 100}{' '}
        <span className="text-xl font-normal text-gray-600">
          per user / {interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="planName" value={name} />
        <input type="hidden" name="amount" value={price} />
        <SubmitButton />
      </form>
    </div>
  );
}
