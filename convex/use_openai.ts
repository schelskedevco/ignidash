'use node';

import { ConvexError } from 'convex/values';
import { AzureOpenAI } from 'openai';
import { internalAction } from './_generated/server';
import type { Id, Doc } from './_generated/dataModel';
import { internal } from './_generated/api';

import type { SubscriptionType } from './utils/ai_utils';

let openaiChat: AzureOpenAI | null = null;
let openaiInsights: AzureOpenAI | null = null;

const apiKey = process.env.OPENAI_API_KEY;
const endpoint = process.env.OPENAI_ENDPOINT;
if (apiKey && endpoint) {
  openaiChat = new AzureOpenAI({
    endpoint,
    apiKey,
    deployment: 'gpt-5.2-chat',
    apiVersion: '2024-04-01-preview',
  });

  openaiInsights = new AzureOpenAI({
    endpoint,
    apiKey,
    deployment: 'gpt-5.2',
    apiVersion: '2024-12-01-preview',
  });
}

type StreamChatParams = {
  userId: string;
  messages: Doc<'messages'>[];
  assistantMessageId: Id<'messages'>;
  systemPrompt: string;
  subscriptionStartTime: number;
  subscriptionType: SubscriptionType;
};

export const streamChat = internalAction({
  handler: async (
    ctx,
    { userId, messages, assistantMessageId, systemPrompt, subscriptionStartTime, subscriptionType }: StreamChatParams
  ) => {
    if (!openaiChat) throw new ConvexError('Azure OpenAI environment variables are not set.');

    const hasBody = (msg: Doc<'messages'>): msg is Doc<'messages'> & { body: string } => msg.body !== undefined;

    try {
      const stream = await openaiChat.chat.completions.create({
        model: 'gpt-5.2-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.filter(hasBody).map((msg) => ({ role: msg.author, content: msg.body })),
        ],
        stream: true,
        stream_options: { include_usage: true },
        max_completion_tokens: 1024,
      });

      let body = '';
      let lastWriteTime = Date.now();

      for await (const part of stream) {
        if (part.choices.length > 0) {
          const choice = part.choices[0];

          if (choice.finish_reason === 'content_filter') {
            body += '\n\n**[Response was cut short by content filter]**';
          }

          if (choice.delta.content) {
            body += choice.delta.content;
            const now = Date.now();
            if (now - lastWriteTime > 1000) {
              await ctx.runMutation(internal.messages.setBody, { messageId: assistantMessageId, body });
              lastWriteTime = now;
            }
          }
        }

        if (part.usage) {
          await ctx.runMutation(internal.messages.setUsage, {
            messageId: assistantMessageId,
            userId,
            inputTokens: part.usage.prompt_tokens,
            outputTokens: part.usage.completion_tokens,
            totalTokens: part.usage.total_tokens,
            subscriptionStartTime,
            subscriptionType,
          });
        }
      }

      await ctx.runMutation(internal.messages.setBody, { messageId: assistantMessageId, body, isLoading: false });
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

type StreamInsightsParams = {
  userId: string;
  insightId: Id<'insights'>;
  systemPrompt: string;
  subscriptionStartTime: number;
  subscriptionType: SubscriptionType;
};

export const streamInsights = internalAction({
  handler: async (ctx, { userId, insightId, systemPrompt, subscriptionStartTime, subscriptionType }: StreamInsightsParams) => {
    if (!openaiInsights) throw new ConvexError('Azure OpenAI environment variables are not set.');

    try {
      const stream = await openaiInsights.chat.completions.create({
        model: 'gpt-5.2',
        messages: [{ role: 'system', content: systemPrompt }],
        stream: true,
        stream_options: { include_usage: true },
        max_completion_tokens: 8192,
      });

      let content = '';
      let lastWriteTime = Date.now();

      for await (const part of stream) {
        if (part.choices.length > 0) {
          const choice = part.choices[0];

          if (choice.finish_reason === 'content_filter') {
            content += '\n\n**[Response was cut short by content filter]**';
          }

          if (choice.delta.content) {
            content += choice.delta.content;
            const now = Date.now();
            if (now - lastWriteTime > 5000) {
              await ctx.runMutation(internal.insights.setContent, { insightId, content });
              lastWriteTime = now;
            }
          }
        }

        if (part.usage) {
          await ctx.runMutation(internal.insights.setUsage, {
            insightId,
            userId,
            inputTokens: part.usage.prompt_tokens,
            outputTokens: part.usage.completion_tokens,
            totalTokens: part.usage.total_tokens,
            subscriptionStartTime,
            subscriptionType,
          });
        }
      }

      await ctx.runMutation(internal.insights.setContent, { insightId, content, isLoading: false });
    } catch (error) {
      if (error instanceof AzureOpenAI.APIError) {
        console.error(error);

        const content = `An unexpected error occurred: ${error.message}.`;
        await ctx.runMutation(internal.insights.setContent, { insightId, content, isLoading: false });
      } else {
        const content = 'An unexpected error occurred. Please try again later.';
        await ctx.runMutation(internal.insights.setContent, { insightId, content, isLoading: false });

        throw error;
      }
    }
  },
});
