import posthog from 'posthog-js';
import { useEffect } from 'react';

import { authClient } from '@/lib/auth-client';

export function usePostHogIdentify() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      });
    }
  }, [session]);
}
