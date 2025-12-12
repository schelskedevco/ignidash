'use node';

import { AzureOpenAI } from 'openai';
import { internalAction } from './_generated/server';
import type { Id, Doc } from './_generated/dataModel';
import { internal } from './_generated/api';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is not set.');

const endpoint = process.env.OPENAI_ENDPOINT;
if (!endpoint) throw new Error('OPENAI_ENDPOINT environment variable is not set.');

const openai = new AzureOpenAI({
  endpoint,
  apiKey,
  deployment: 'gpt-5.1-chat',
  apiVersion: '2024-04-01-preview',
});

type StreamChatParams = {
  userId: string;
  messages: Doc<'messages'>[];
  assistantMessageId: Id<'messages'>;
  systemPrompt: string;
};

export const streamChat = internalAction({
  handler: async (ctx, { userId, messages, assistantMessageId, systemPrompt }: StreamChatParams) => {
    const hasBody = (msg: Doc<'messages'>): msg is Doc<'messages'> & { body: string } => msg.body !== undefined;

    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-5.1-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.filter(hasBody).map((msg) => ({ role: msg.author, content: msg.body })),
        ],
        stream: true,
        stream_options: { include_usage: true },
        max_completion_tokens: 1024,
      });

      let body = '';
      for await (const part of stream) {
        if (part.choices.length > 0) {
          const choice = part.choices[0];

          if (choice.delta.content) {
            body += choice.delta.content;
            await ctx.runMutation(internal.messages.setBody, { messageId: assistantMessageId, body });
          }
        }

        if (part.usage) {
          await ctx.runMutation(internal.messages.setUsage, {
            messageId: assistantMessageId,
            userId,
            inputTokens: part.usage.prompt_tokens,
            outputTokens: part.usage.completion_tokens,
            totalTokens: part.usage.total_tokens,
          });
        }
      }

      await ctx.runMutation(internal.messages.setIsLoading, { messageId: assistantMessageId, isLoading: false });
    } catch (error) {
      if (error instanceof AzureOpenAI.APIError) {
        console.error(error);

        const body = `An unexpected error occurred: ${error.message}.`;
        await ctx.runMutation(internal.messages.setBody, { messageId: assistantMessageId, body, isLoading: false });
      } else {
        const body = 'An unexpected error occurred. Please try again later.';
        await ctx.runMutation(internal.messages.setBody, { messageId: assistantMessageId, body, isLoading: false });

        throw error;
      }
    }
  },
});
