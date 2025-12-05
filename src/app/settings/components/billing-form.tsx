import type { CustomerStateData, SubscriptionData } from '@/hooks/use-customer-state';

interface BillingFormProps {
  customerState: CustomerStateData | null;
  subscription: SubscriptionData | null;
}

export default function BillingForm({ customerState, subscription }: BillingFormProps) {
  return <div>Billing Form Component</div>;
}
