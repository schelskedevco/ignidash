/** Plan ID extraction from Next.js route params. */
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';

export function useSelectedPlanId(): Id<'plans'> {
  const params = useParams();
  return params.planId as Id<'plans'>;
}
