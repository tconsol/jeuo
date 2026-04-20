import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../../lib/api';

const PLANS = [
  {
    name: 'Free',
    key: 'free',
    price: 0,
    color: 'bg-gray-50 border-gray-200',
    badge: 'text-gray-600 bg-gray-100',
    features: [
      'View live matches',
      'Join public activities',
      'View venues & scores',
      'Basic player profile',
    ],
    limits: ['Cannot book venues', 'Cannot create activities', 'Cannot manage scoring'],
  },
  {
    name: 'Pro',
    key: 'pro',
    price: 499,
    color: 'bg-blue-50 border-blue-300',
    badge: 'text-blue-700 bg-blue-100',
    popular: true,
    features: [
      'Everything in Free',
      'Book venues',
      'Create & manage activities',
      'Live scoring & commentary',
      'Team management',
      'Advanced player stats',
    ],
    limits: ['Cannot create tournaments'],
  },
  {
    name: 'Premium',
    key: 'premium',
    price: 999,
    color: 'bg-purple-50 border-purple-300',
    badge: 'text-purple-700 bg-purple-100',
    features: [
      'Everything in Pro',
      'Create & manage tournaments',
      'Priority support',
      'Detailed analytics',
      'Custom team branding',
      'Tournament brackets & seeding',
    ],
    limits: [],
  },
];

export default function Plans() {
  const { user } = useSelector((s) => s.auth);
  const currentPlan = user?.subscription?.plan || 'free';
  const qc = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: (plan) => api.post('/users/subscription', { plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth'] });
      alert('Subscription updated successfully!');
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="mt-2 text-gray-500">
          Unlock features to elevate your sports experience
        </p>
        {currentPlan !== 'free' && (
          <span className="inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            Current plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isDowngrade =
            PLANS.findIndex((p) => p.key === currentPlan) >
            PLANS.findIndex((p) => p.key === plan.key);

          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl border-2 p-6 ${plan.color} ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <div className="text-center mb-6">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${plan.badge}`}>
                  {plan.name}
                </span>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500 text-sm">/month</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5"><FiCheck size={14} className="inline" /></span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
                {plan.limits.map((l) => (
                  <li key={l} className="flex items-start gap-2 text-sm">
                    <span className="text-red-400 mt-0.5"><FiX size={14} className="inline" /></span>
                    <span className="text-gray-400">{l}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent || isDowngrade || upgradeMutation.isPending}
                onClick={() => upgradeMutation.mutate(plan.key)}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition ${
                  isCurrent
                    ? 'bg-gray-200 text-gray-500 cursor-default'
                    : isDowngrade
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCurrent ? 'Current Plan' : isDowngrade ? 'Downgrade N/A' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
