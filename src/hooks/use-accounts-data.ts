import { useState, useEffect, useCallback } from 'react';

import { authClient } from '@/lib/auth-client';

type AccountsData = {
  id: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
  accountId: string;
  scopes: string[];
}[];

export function useAccountsList() {
  const [accounts, setAccounts] = useState<AccountsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);

    authClient
      .listAccounts()
      .then(({ data, error: apiError }) => {
        if (!mounted) return;

        if (apiError) {
          setError(new Error(apiError.message));
          setAccounts(null);
        } else {
          setAccounts(data);
        }
      })
      .catch((err) => mounted && setError(err))
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  return { accounts, isLoading, error, refetch };
}
