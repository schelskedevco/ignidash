'use client';

import { useState } from 'react';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import type { Doc } from '@/convex/_generated/dataModel';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';

import { Button } from '@/components/catalyst/button';
import { Textarea } from '@/components/catalyst/textarea';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';

interface ConversationListItemProps {
  conversation: Doc<'conversations'>;
}

function ConversationListItem({ conversation }: ConversationListItemProps) {
  return (
    <li key={conversation._id} className="relative flex items-center space-x-4 px-2 py-4 hover:bg-zinc-50 dark:hover:dark:bg-black/10">
      <div className="min-w-0 flex-auto">
        <div className="flex items-center gap-x-3">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{conversation.title}</p>
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">
          <p className="whitespace-nowrap">
            Created{' '}
            <time dateTime={new Date(conversation._creationTime).toISOString()}>
              {new Date(conversation._creationTime).toLocaleDateString()}
            </time>
          </p>
        </div>
      </div>
      <div className="flex flex-none items-center gap-x-4">
        <div className="relative flex-none">
          <Dropdown>
            <DropdownButton plain aria-label="Open options">
              <EllipsisVerticalIcon />
            </DropdownButton>
            <DropdownMenu portal={false}>
              <DropdownItem disabled={false} onClick={() => {}}>
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </li>
  );
}

interface AIChatDrawerProps {
  setOpen: (open: boolean) => void;
}

export default function AIChatDrawer({ setOpen }: AIChatDrawerProps) {
  const planId = useSelectedPlanId();

  const conversations = useQuery(api.conversations.list, { planId }) ?? [];
  const m = useMutation(api.messages.send);

  const [chatMessage, setChatMessage] = useState<string>('');
  const disabled = chatMessage.trim().length === 0;

  return (
    <>
      <aside className="hidden md:fixed md:top-[4.8125rem] md:bottom-0 md:-mx-3 md:flex md:w-64 md:flex-col">
        <div className="border-border/50 flex grow flex-col border-r bg-zinc-50 dark:bg-black/10">
          <ul className="divide-border/25 flex-1 divide-y overflow-y-auto">
            {conversations.map((conversation) => (
              <ConversationListItem key={conversation._id} conversation={conversation} />
            ))}
          </ul>
          <div className="border-border/50 border-t p-4">
            <Button className="w-full">New chat</Button>
          </div>
        </div>
      </aside>
      <main tabIndex={-1} className="flex h-full min-w-80 flex-col focus:outline-none md:pl-64">
        <div className="flex-1 overflow-y-auto"></div>
        <div className="flex-shrink-0 py-4">
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
