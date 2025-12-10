'use client';

import { useState } from 'react';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/catalyst/button';
import { Textarea } from '@/components/catalyst/textarea';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';

interface AIChatDrawerProps {
  setOpen: (open: boolean) => void;
}

export default function AIChatDrawer({ setOpen }: AIChatDrawerProps) {
  const planId = useSelectedPlanId();

  const m = useMutation(api.messages.send);

  const [chatMessage, setChatMessage] = useState<string>('');
  const disabled = chatMessage.trim().length === 0;

  return (
    <>
      <aside className="hidden md:fixed md:top-[4.8125rem] md:bottom-0 md:-mx-3 md:flex md:w-64 md:flex-col">
        <div className="border-border/50 flex grow flex-col border-r bg-zinc-50 dark:bg-black/10">
          <div className="flex-1 overflow-y-auto"></div>

          <div className="border-border/25 border-t p-4">
            <Button className="w-full">New chat</Button>
          </div>
        </div>
      </aside>
      <main tabIndex={-1} className="flex h-full min-w-80 flex-col focus:outline-none md:pl-64">
        <div className="flex-1 overflow-y-auto"></div>
        <div className="border-border/25 flex-shrink-0 border-t py-4">
          <form
            className="relative"
            onSubmit={async (e) => {
              e.preventDefault();
              if (disabled) return;

              await m({ conversationId: undefined, planId, content: chatMessage });
              setChatMessage('');
            }}
          >
            <Textarea
              resizable={false}
              rows={4}
              name="ai-chat"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!disabled) e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <Button disabled={disabled} type="submit" className="absolute right-2 bottom-2 disabled:cursor-not-allowed" color="rose">
              <PaperAirplaneIcon className="h-5 w-5 -rotate-90" />
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
