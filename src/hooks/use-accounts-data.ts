import { useState, useEffect } from 'react';

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

  useEffect(() => {
    let mounted = true;

    authClient
      .listAccounts()
      .then(({ data, error: apiError }) => {
        if (!mounted) return;

        if (apiError) {
          setError(new Error(apiError.message));
          return;
        }

        setAccounts(data);
      })
      .catch((err) => mounted && setError(err))
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  return { accounts, isLoading, error };
}
