'use client';

import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';

import { Button } from '@/components/catalyst/button';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';

interface AIChatDrawerProps {
  setOpen: (open: boolean) => void;
}

export default function AIChatDrawer({ setOpen }: AIChatDrawerProps) {
  const planId = useSelectedPlanId();

  const m = useMutation(api.messages.send);

  return (
    <>
      <div className="hidden md:fixed md:top-[4.8125rem] md:bottom-0 md:-mx-3 md:flex md:w-64 md:flex-col">
        <div className="border-border/50 flex grow flex-col border-r bg-zinc-50 dark:bg-black/10">
          <Button onClick={async () => await m({ conversationId: undefined, planId, content: 'What is a taxable brokerage account?' })}>
            Send Demo Message
          </Button>
        </div>
      </div>
    </>
  );
}
