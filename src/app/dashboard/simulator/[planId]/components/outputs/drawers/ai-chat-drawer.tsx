'use client';

import { ConvexError } from 'convex/values';
import { useState, useRef, useEffect, useMemo } from 'react';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation, usePaginatedQuery } from 'convex/react';
import { useSmoothText } from '@convex-dev/agent/react';
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/16/solid';
import { FireIcon } from '@heroicons/react/24/solid';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { CircleUserRoundIcon, CopyIcon, CheckIcon, WandSparklesIcon, Loader2Icon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useTheme } from 'next-themes';
import posthog from 'posthog-js';

import { Button } from '@/components/catalyst/button';
import { Textarea } from '@/components/catalyst/textarea';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import {
  useCachedKeyMetrics,
  useSelectedConversationId,
  useUpdateSelectedConversationId,
  useClearSelectedConversationId,
} from '@/lib/stores/simulator-store';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu, DropdownLabel, DropdownDescription } from '@/components/catalyst/dropdown';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Subheading } from '@/components/catalyst/heading';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 12;

const DEMO_QUESTIONS = [
  {
    label: 'Early retirement access strategies',
    question:
      'What are the different strategies for accessing retirement funds before age 59½ without penalties? Include methods like Roth conversion ladders, 72(t) SEPP, and rule of 55.',
  },
  {
    label: 'Safe withdrawal rates',
    question:
      'What is the safe withdrawal rate and what does it mean for my retirement plan? Explain where the 4% rule comes from, what it represents, and how it helps determine how much I need to save to retire.',
  },
  {
    label: 'Traditional vs. Roth accounts',
    question:
      'How should I think about the tradeoffs between traditional and Roth accounts for FIRE? What are the tax implications during accumulation and withdrawal phases?',
  },
  {
    label: 'Roth conversion ladders',
    question: 'How does a Roth conversion ladder work for early retirement? Walk me through the mechanics, timing, and tax considerations.',
  },
  {
    label: 'Healthcare before Medicare',
    question:
      'What are my options for healthcare coverage between early retirement and Medicare eligibility at 65? How do ACA subsidies, HSAs, and COBRA work?',
  },
  {
    label: 'Optimizing contribution order',
    question:
      'What is the optimal order for contributing to different retirement accounts (401k, IRA, HSA, taxable brokerage) when pursuing FIRE?',
  },
  {
    label: 'Social Security timing',
    question:
      'How does retiring early affect Social Security benefits? What are the tradeoffs between claiming at 62, full retirement age, or 70 for someone pursuing FIRE?',
  },
];

interface DemoQuestionButtonProps {
  label: string;
  question: string;
  setChatMessage: (message: string) => void;
}

function DemoQuestionButton({ label, question, setChatMessage }: DemoQuestionButtonProps) {
  return (
    <button
      onClick={() => {
        posthog.capture('select_demo_question', { label });
        setChatMessage(question);
      }}
      type="button"
      className={cn(
        'text-muted-foreground bg-background hover:bg-emphasized-background focus-outline border-border/25 relative inline-flex items-center rounded-full border px-3 py-2 text-sm shadow-md focus:z-10'
      )}
    >
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

interface ChatMessageProps {
  message: Doc<'messages'>;
  image?: string | null;
}

function ChatMessage({ message, image }: ChatMessageProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const { resolvedTheme } = useTheme();

  const [visibleText] = useSmoothText(message.body ?? '', {
    startStreaming: message.author === 'assistant' && message.isLoading === true,
  });

  if (message.author === 'system') return null;

  const handleCopy = async () => {
    const messageToCopy = message.body;
    if (messageToCopy) {
      await navigator.clipboard.writeText(messageToCopy);
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
          <div
            className={cn('prose prose-sm prose-stone max-w-none', {
              'prose-invert': (resolvedTheme === 'dark' && !isUser) || (resolvedTheme === 'light' && isUser),
            })}
          >
            <ReactMarkdown>{visibleText}</ReactMarkdown>
          </div>
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
  setSelectedConversationId: (id: Id<'conversations'>) => void;
  clearSelectedConversationId: () => void;
}

function ConversationListItem({
  conversation,
  selectedConversationId,
  setSelectedConversationId,
  clearSelectedConversationId,
}: ConversationListItemProps) {
  const deleteConversation = useMutation(api.conversations.deleteConversation);

  const handleDelete = async () => {
    if (conversation._id === selectedConversationId) clearSelectedConversationId();
    posthog.capture('delete_conversation');
    await deleteConversation({ conversationId: conversation._id });
  };

  return (
    <li
      key={conversation._id}
      className={cn('relative flex items-center space-x-4 px-2 py-4 hover:bg-stone-100 dark:hover:bg-black/15', {
        'bg-stone-100 dark:bg-black/15': conversation._id === selectedConversationId,
      })}
    >
      <button
        className="focus-outline min-w-0 flex-auto"
        onClick={() => {
          posthog.capture('select_conversation');
          setSelectedConversationId(conversation._id);
        }}
      >
        <div className="flex items-center gap-x-3">
          <p
            className={cn(
              'truncate text-sm font-semibold text-stone-900 dark:text-white',
              'relative after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-current/80',
              'after:w-0 after:transition-all after:duration-300 after:ease-in-out',
              conversation._id === selectedConversationId && 'after:w-full'
            )}
          >
            {conversation.title}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs text-stone-500 dark:text-stone-400">
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
                <DropdownLabel>Delete now</DropdownLabel>
                <DropdownDescription>This cannot be undone.</DropdownDescription>
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
  const keyMetrics = useCachedKeyMetrics();

  const scrollRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const prevIsLoadingRef = useRef<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);

  const selectedConversationId = useSelectedConversationId(planId);
  const updateSelectedConversationId = useUpdateSelectedConversationId();
  const clearSelectedConversationId = useClearSelectedConversationId();

  const [chatState, setChatState] = useState<Record<string, { chatMessage: string; errorMessage: string }>>({});

  const stateKey = selectedConversationId ?? 'new';
  const { chatMessage, errorMessage } = chatState[stateKey] ?? { chatMessage: '', errorMessage: '' };

  const updateChatState = (updates: Partial<{ chatMessage: string; errorMessage: string }>) => {
    setChatState((prev) => ({ ...prev, [stateKey]: { ...(prev[stateKey] ?? { chatMessage: '', errorMessage: '' }), ...updates } }));
  };

  const conversations = useQuery(api.conversations.list, { planId });
  const selectedConversation = conversations?.find((c) => c._id === selectedConversationId) ?? undefined;

  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.list,
    selectedConversationId ? { conversationId: selectedConversationId } : 'skip',
    { initialNumItems: PAGE_SIZE }
  );
  const messages = useMemo(() => results.sort((a, b) => a.updatedAt - b.updatedAt), [results]);

  const user = useQuery(api.auth.getCurrentUserSafe);
  const canUseChat = useQuery(api.messages.canUseChat) ?? false;

  const isLoadingFirstPage = status === 'LoadingFirstPage';
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [selectedConversationId, isLoadingFirstPage]);

  const isLoading = messages.length > 0 && messages[messages.length - 1].isLoading === true;
  const showMessageLoadingDots =
    isLoading && messages[messages.length - 1].author === 'assistant' && messages[messages.length - 1].body === undefined;
  const disabled = chatMessage.trim().length === 0 || isLoading || !canUseChat;

  useEffect(() => {
    if (!prevIsLoadingRef.current && scrollRef.current && isLoading) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    prevIsLoadingRef.current = isLoading;
  }, [isLoading]);

  const m = useMutation(api.messages.send);
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;

    try {
      updateChatState({ errorMessage: '' });
      posthog.capture('send_ai_message');
      const { conversationId } = await m({ conversationId: selectedConversationId, planId, content: chatMessage, keyMetrics });
      updateChatState({ chatMessage: '' });
      updateSelectedConversationId(planId, conversationId);
    } catch (error) {
      updateChatState({ errorMessage: error instanceof ConvexError ? error.message : 'Failed to send message.' });
    }
  };

  const handleLoadMore = () => {
    prevScrollHeightRef.current = scrollAreaRef.current?.scrollHeight ?? 0;
    posthog.capture('load_more_ai_messages');
    loadMore(PAGE_SIZE);
  };

  useEffect(() => {
    const container = scrollAreaRef.current;
    if (!container || !prevScrollHeightRef.current) return;

    container.scrollTop += container.scrollHeight - prevScrollHeightRef.current;
    prevScrollHeightRef.current = 0;
  }, [messages.length]);

  return (
    <>
      <aside className="hidden md:fixed md:top-[4.8125rem] md:bottom-0 md:-mx-3 md:flex md:w-64 md:flex-col">
        <div className="border-border/50 flex h-full flex-col border-r bg-stone-50 dark:bg-black/10">
          <ul className="divide-border/25 flex-1 divide-y overflow-y-auto">
            <Subheading level={3} className="px-4 py-3">
              Recent Chats
            </Subheading>
            {conversations !== undefined ? (
              conversations.map((conversation) => (
                <ConversationListItem
                  key={conversation._id}
                  conversation={conversation}
                  selectedConversationId={selectedConversationId}
                  setSelectedConversationId={(id) => updateSelectedConversationId(planId, id)}
                  clearSelectedConversationId={() => clearSelectedConversationId(planId)}
                />
              ))
            ) : (
              <div className="space-y-3 px-2 py-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}
          </ul>
          <div className="border-border/50 border-t p-4">
            <Button
              color="dark/white"
              className="w-full"
              onClick={() => {
                posthog.capture('create_new_chat', { location: 'drawer' });
                clearSelectedConversationId(planId);
              }}
            >
              New chat
            </Button>
          </div>
        </div>
      </aside>
      <main tabIndex={-1} className="flex h-full min-w-80 flex-col focus:outline-none md:pl-64">
        {selectedConversationId && (
          <div className="border-border/50 from-emphasized-background to-background -mx-2 block border-b bg-gradient-to-l sm:-mx-3 md:hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <h3 className="truncate text-sm font-semibold text-stone-900 dark:text-white">{selectedConversation?.title || 'Chat'}</h3>
              <Button
                outline
                onClick={() => {
                  posthog.capture('create_new_chat', { location: 'header' });
                  clearSelectedConversationId(planId);
                }}
              >
                <PlusIcon />
                New chat
              </Button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            {!selectedConversationId ? (
              <div className="absolute inset-0 flex h-full flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-md">
                  <FireIcon className="text-primary mx-auto h-10 w-auto" />
                  <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-stone-900 dark:text-white">Your AI Assistant</h2>
                  <p className="text-muted-foreground mt-2 text-sm/6">
                    The AI assistant is for educational purposes only and does not provide professional financial advice. Read our{' '}
                    <Link href="/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      Terms of Service
                    </Link>{' '}
                    for more.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-6 pt-6 pb-32">
                  {status === 'LoadingMore' && (
                    <div className="flex justify-center">
                      <Loader2Icon className="size-8 animate-spin" />
                    </div>
                  )}
                  {status === 'CanLoadMore' && (
                    <div className="flex justify-center">
                      <Button outline onClick={handleLoadMore}>
                        Load more
                      </Button>
                    </div>
                  )}
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
                </div>
                <div ref={scrollRef} />
              </>
            )}
          </ScrollArea>
        </div>
        <div className="flex-shrink-0 pb-4">
          {!selectedConversationId && (
            <div className="isolate -ml-1 hidden flex-wrap justify-center gap-2 px-1 py-2 lg:flex">
              {DEMO_QUESTIONS.map(({ label, question }) => (
                <DemoQuestionButton
                  key={label}
                  label={label}
                  question={question}
                  setChatMessage={(message) => {
                    updateChatState({ chatMessage: message });
                    if (sendButtonRef.current) sendButtonRef.current.focus();
                  }}
                />
              ))}
            </div>
          )}
          {selectedConversationId && errorMessage && <ErrorMessageCard errorMessage={errorMessage} className="mb-2" />}
          <form className="relative" onSubmit={handleSendMessage}>
            <Textarea
              autoFocus
              placeholder={!selectedConversationId ? 'Ask me something about your plan...' : 'Reply...'}
              resizable={false}
              rows={4}
              name="ai-chat"
              value={chatMessage}
              onChange={(e) => updateChatState({ chatMessage: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!disabled) e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <Button
              disabled={disabled}
              type="submit"
              className="absolute right-2 bottom-2 disabled:cursor-not-allowed"
              color="rose"
              aria-label="Send"
              ref={sendButtonRef}
            >
              <PaperAirplaneIcon className="-rotate-90" />
            </Button>
          </form>
          <p className="text-muted-foreground mt-2 text-center text-xs">
            {canUseChat ? (
              'AI can make mistakes. Verify important info.'
            ) : (
              <strong>
                Upgrade to start chatting.{' '}
                <Link href="/pricing" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  View pricing →
                </Link>
              </strong>
            )}
          </p>
        </div>
      </main>
    </>
  );
}
