import { api } from '@/convex/_generated/api';
import { redirect } from 'next/navigation';
import { fetchMutation } from 'convex/nextjs';

import { getToken } from '@/lib/auth-server';

export default async function SimulatorIndexPage() {
  const token = await getToken();
  if (!token) redirect('/signin');

  const planId = await fetchMutation(api.plans.getOrCreateDefaultPlan, {}, { token });
  redirect(`/dashboard/simulator/${planId}`);
}
