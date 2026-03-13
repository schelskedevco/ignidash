'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/catalyst/button';
import { BuildingLibraryIcon } from '@heroicons/react/16/solid';

interface PlaidLinkButtonProps {
  /** When provided, opens Link in update/account-selection mode for an existing institution. */
  plaidItemId?: Id<'plaidItems'>;
  label?: string;
  onSuccess?: () => void;
  /** Auto-fetches token and opens Link on mount (used for programmatic triggering). */
  autoOpen?: boolean;
}

export default function PlaidLinkButton({ plaidItemId, label, onSuccess, autoOpen }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);

  const createLinkToken = useAction(api.plaid.createLinkToken);
  const createUpdateLinkToken = useAction(api.plaid.createUpdateLinkToken);
  const exchangePublicToken = useAction(api.plaid.exchangePublicToken);
  const updatePlaidItemAccounts = useAction(api.plaid.updatePlaidItemAccounts);

  const fetchLinkToken = useCallback(async () => {
    setIsLoadingToken(true);
    try {
      const token = plaidItemId ? await createUpdateLinkToken({ plaidItemId }) : await createLinkToken();
      setLinkToken(token);
    } catch (e) {
      console.error('Failed to create Plaid link token:', e);
    } finally {
      setIsLoadingToken(false);
    }
  }, [plaidItemId, createLinkToken, createUpdateLinkToken]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
      const accounts = (metadata.accounts ?? []).map((a) => ({
        plaidAccountId: a.id,
        name: a.name,
        officialName: a.name,
        type: a.type ?? 'investment',
        subtype: a.subtype ?? undefined,
      }));

      if (plaidItemId) {
        // Update mode — no token exchange, just update accounts and re-sync
        await updatePlaidItemAccounts({ plaidItemId, accounts });
      } else {
        const institution = metadata.institution;
        await exchangePublicToken({
          publicToken,
          institutionName: institution?.name ?? 'Unknown Institution',
          institutionId: institution?.institution_id ?? undefined,
          accounts,
        });
      }

      setLinkToken(null);
      onSuccess?.();
    },
    onExit: () => {
      setLinkToken(null);
      onSuccess?.();
    },
  });

  // Auto-open when used in programmatic trigger mode
  useEffect(() => {
    if (plaidItemId || autoOpen) fetchLinkToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  const defaultLabel = plaidItemId ? 'Manage accounts' : 'Connect institution';

  return (
    <Button outline onClick={fetchLinkToken} disabled={isLoadingToken}>
      <BuildingLibraryIcon />
      {isLoadingToken ? 'Connecting…' : (label ?? defaultLabel)}
    </Button>
  );
}
