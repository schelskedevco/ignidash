import { FireIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import type { Stripe } from 'stripe';

import { Badge } from '@/components/catalyst/badge';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Subheading } from '@/components/catalyst/heading';

function formatCurrency(amount: number, currency: string, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

interface SubscriptionOverviewProps {
  subscription: Stripe.Subscription;
}

export default function SubscriptionOverview({ subscription }: SubscriptionOverviewProps) {
  const itemData = subscription.items.data[0];
  const plan = itemData.plan;
  const isFreeTrial = subscription.status === 'trialing';

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <FireIcon className="text-primary mx-auto h-10 w-auto" />
          <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-stone-900 dark:text-white">
            {isFreeTrial ? 'Your Ignidash Pro trial has started!' : 'Welcome to Ignidash Pro!'}
          </h2>
        </div>
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="border-border/25 from-emphasized-background to-background border-y bg-gradient-to-bl px-6 py-12 shadow-sm sm:rounded-lg sm:border sm:px-12 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <Subheading>Subscription Details</Subheading>
            <DescriptionList>
              <DescriptionTerm>Your Plan</DescriptionTerm>
              <DescriptionDetails className="flex items-center">
                Ignidash Pro
                {(subscription.status === 'active' || subscription.status === 'trialing') && (
                  <Badge color="green" className="ml-2">
                    {subscription.status === 'active' ? 'Active' : 'Free trial'}
                  </Badge>
                )}
              </DescriptionDetails>

              {plan.amount && (
                <>
                  <DescriptionTerm>{isFreeTrial ? 'Price After Trial' : 'Amount'}</DescriptionTerm>
                  <DescriptionDetails>
                    {formatCurrency(plan.amount, plan.currency)} / {plan.interval}
                  </DescriptionDetails>
                </>
              )}

              <DescriptionTerm>{isFreeTrial ? 'Trial Start Date' : 'Billing Start Date'}</DescriptionTerm>
              <DescriptionDetails>{new Date(itemData.current_period_start * 1000).toLocaleDateString()}</DescriptionDetails>

              <DescriptionTerm>Next Billing Date</DescriptionTerm>
              <DescriptionDetails>{new Date(itemData.current_period_end * 1000).toLocaleDateString()}</DescriptionDetails>
            </DescriptionList>
          </div>
          <Link
            href="/dashboard"
            className="mx-auto mt-4 block w-9/10 rounded-md bg-rose-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 sm:w-full dark:bg-rose-500 dark:hover:bg-rose-400 dark:focus-visible:outline-rose-500"
          >
            Go to dashboard <span aria-hidden="true">→</span>
          </Link>
          <p className="mt-10 text-center text-sm/6 text-stone-500 dark:text-stone-400">
            Manage your subscription from{' '}
            <Link href="/settings" className="font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300">
              Settings
            </Link>{' '}
            at any time.
          </p>
        </div>
      </div>
      <p className="pb-6 text-center text-xs/6 text-stone-500 dark:text-stone-400">
        Questions? Read our{' '}
        <Link href="/terms" className="underline hover:text-stone-700 dark:hover:text-stone-300">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-stone-700 dark:hover:text-stone-300">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
