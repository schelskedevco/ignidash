'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { FireIcon } from '@heroicons/react/24/solid';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { CircleUserRoundIcon, CopyIcon, CheckIcon, WandSparklesIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/catalyst/button';
import { Textarea } from '@/components/catalyst/textarea';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Subheading } from '@/components/catalyst/heading';

interface ChatMessageProps {
  message: Doc<'messages'>;
  image?: string | null;
}

function ChatMessage({ message, image }: ChatMessageProps) {
  const [copied, setCopied] = useState<boolean>(false);

  if (message.author === 'system') return null;

  const handleCopy = () => {
    const messageToCopy = message.body;
    if (messageToCopy) {
      navigator.clipboard.writeText(messageToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isUser = message.author === 'user';

  return (
    <div className={cn('flex gap-4', { 'justify-end': isUser })}>
      {message.author === 'assistant' && (
        <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <WandSparklesIcon className="text-background h-4 w-4" />
        </div>
      )}
      <div
        className={cn('border-border/50 max-w-[85%] rounded-2xl border p-4 shadow-md', {
          'bg-foreground text-background': isUser,
          'bg-emphasized-background text-foreground': !isUser,
        })}
      >
        <div className="space-y-2">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.body}</p>
          <div className="flex items-center gap-2">
            <p className={cn('text-xs', { 'text-background/60': isUser }, { 'text-foreground/60': !isUser })}>
              <time dateTime={new Date(message._creationTime).toISOString()}>
                {new Date(message._creationTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </p>
            <button
              onClick={handleCopy}
              aria-label="Copy chat message"
              className={cn(
                'text-xs opacity-60 transition-opacity hover:opacity-100',
                { 'text-background': isUser },
                { 'text-foreground': !isUser }
              )}
            >
              {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
      {message.author === 'user' && (
        <div className="bg-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {image ? (
            <Image src={image} alt="Profile image" width={32} height={32} className="object-cover" />
          ) : (
            <CircleUserRoundIcon className="text-background text-sm font-medium" />
          )}
        </div>
      )}
    </div>
  );
}

interface ConversationListItemProps {
  conversation: Doc<'conversations'>;
  selectedConversationId: Id<'conversations'> | undefined;
  setSelectedConversationId: (id: Id<'conversations'> | undefined) => void;
}

function ConversationListItem({ conversation, selectedConversationId, setSelectedConversationId }: ConversationListItemProps) {
  const deleteConversation = useMutation(api.conversations.deleteConversation);

  const handleDelete = async () => {
    if (conversation._id === selectedConversationId) setSelectedConversationId(undefined);
    await deleteConversation({ conversationId: conversation._id });
  };

  return (
    <li
      key={conversation._id}
      className={cn('relative flex items-center space-x-4 px-2 py-4 hover:bg-zinc-100 dark:hover:bg-black/15', {
        'bg-zinc-100 dark:bg-black/15': conversation._id === selectedConversationId,
      })}
    >
      <button className="focus-outline min-w-0 flex-auto" onClick={() => setSelectedConversationId(conversation._id)}>
        <div className="flex items-center gap-x-3">
          <p
            className={cn('truncate text-sm font-semibold text-zinc-900 dark:text-white', {
              'underline underline-offset-2': conversation._id === selectedConversationId,
            })}
          >
            {conversation.title}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">
          <p className="whitespace-nowrap">
            Created{' '}
            <time dateTime={new Date(conversation._creationTime).toISOString()}>
              {new Date(conversation._creationTime).toLocaleDateString()}
            </time>
          </p>
        </div>
      </button>
      <div className="flex flex-none items-center gap-x-4">
        <div className="relative flex-none">
          <Dropdown>
            <DropdownButton plain aria-label="Open options">
              <EllipsisVerticalIcon />
            </DropdownButton>
            <DropdownMenu portal={false}>
              <DropdownItem disabled={false} onClick={handleDelete}>
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevIsLoadingRef = useRef<boolean>(false);

  const [chatMessage, setChatMessage] = useState<string>('');
  const [selectedConversationId, setSelectedConversationId] = useState<Id<'conversations'> | undefined>(undefined);

  const conversations = useQuery(api.conversations.list, { planId }) ?? [];
  const messages = useQuery(api.messages.list, { conversationId: selectedConversationId }) ?? [];
  const user = useQuery(api.auth.getCurrentUserSafe);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages.length]);

  const isLoading = messages.length > 0 && messages[messages.length - 1].isLoading === true;
  const showMessageLoadingDots =
    isLoading && messages[messages.length - 1].author === 'assistant' && messages[messages.length - 1].body === undefined;
  const disabled = chatMessage.trim().length === 0 || isLoading;

  useEffect(() => {
    if (prevIsLoadingRef.current && scrollRef.current && !isLoading) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    prevIsLoadingRef.current = isLoading;
  }, [isLoading]);

  const m = useMutation(api.messages.send);
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;

    const { conversationId } = await m({ conversationId: selectedConversationId, planId, content: chatMessage });
    setSelectedConversationId(conversationId);

    setChatMessage('');
  };

  return (
    <>
      <aside className="hidden md:fixed md:top-[4.8125rem] md:bottom-0 md:-mx-3 md:flex md:w-64 md:flex-col">
        <div className="border-border/50 flex grow flex-col border-r bg-zinc-50 dark:bg-black/10">
          <ul className="divide-border/25 flex-1 divide-y overflow-y-auto">
            <Subheading level={3} className="px-4 py-3">
              Recent Chats
            </Subheading>
            {conversations.map((conversation) => (
              <ConversationListItem
                key={conversation._id}
                conversation={conversation}
                selectedConversationId={selectedConversationId}
                setSelectedConversationId={setSelectedConversationId}
              />
            ))}
          </ul>
          <div className="border-border/50 border-t p-4">
            <Button color="dark/white" className="w-full" onClick={() => setSelectedConversationId(undefined)}>
              New chat
            </Button>
          </div>
        </div>
      </aside>
      <main tabIndex={-1} className="flex h-full min-w-80 flex-col focus:outline-none md:pl-64">
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {!selectedConversationId ? (
              <div className="absolute inset-0 flex h-full flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-md">
                  <FireIcon className="text-primary mx-auto h-10 w-auto" />
                  <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-zinc-900 dark:text-white">Your AI Assistant</h2>
                  <p className="text-muted-foreground mt-2 text-sm/6">
                    By using the AI assistant, you agree to our{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    . The AI is for educational purposes only and does not constitute professional financial advice.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pt-6 pb-32">
                {messages
                  .filter((message) => message.body !== undefined)
                  .map((message) => (
                    <ChatMessage key={message._id} message={message} image={user?.image} />
                  ))}
                {showMessageLoadingDots && (
                  <div className="flex gap-4">
                    <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                      <WandSparklesIcon className="text-background h-4 w-4" />
                    </div>
                    <div className="bg-emphasized-background border-border/50 text-foreground max-w-[85%] rounded-2xl border p-4 shadow-md">
                      <div className="flex gap-1">
                        <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                        <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                        <div className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>
        </div>
        <div className="flex-shrink-0 pb-4">
          <form className="relative" onSubmit={handleSendMessage}>
            <Textarea
              placeholder={!selectedConversationId ? 'Ask me something about your plan...' : 'Reply...'}
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
              Send
            </Button>
          </form>
          <p className="text-muted-foreground mt-2 text-center text-xs">AI can make mistakes. Verify important info.</p>
        </div>
      </main>
    </>
  );
}
