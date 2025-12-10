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
  deployment: 'gpt-5-mini',
  apiVersion: '2024-04-01-preview',
});

type StreamChatParams = {
  messages: Doc<'messages'>[];
  assistantMessageId: Id<'messages'>;
  systemPrompt: string;
};

export const streamChat = internalAction({
  handler: async (ctx, { messages, assistantMessageId, systemPrompt }: StreamChatParams) => {
    const hasBody = (msg: Doc<'messages'>): msg is Doc<'messages'> & { body: string } => msg.body !== undefined;

    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.filter(hasBody).map((msg) => ({ role: msg.author, content: msg.body })),
        ],
        stream: true,
        stream_options: { include_usage: true },
      });

      let body = '';
      for await (const part of stream) {
        if (part.choices.length > 0 && part.choices[0].delta?.content) {
          body += part.choices[0].delta.content;
          await ctx.runMutation(internal.messages.update, { messageId: assistantMessageId, body });
        }

        if (part.usage) {
          await ctx.runMutation(internal.messages.setUsage, {
            messageId: assistantMessageId,
            inputTokens: part.usage.prompt_tokens,
            outputTokens: part.usage.completion_tokens,
            totalTokens: part.usage.total_tokens,
          });
        }
      }
    } catch (error) {
      if (error instanceof AzureOpenAI.APIError) {
        console.error(error);

        await ctx.runMutation(internal.messages.update, {
          messageId: assistantMessageId,
          body: `OpenAI API call failed with status ${error.status}: ${error.message}.`,
          isLoading: false,
        });
      } else {
        await ctx.runMutation(internal.messages.update, {
          messageId: assistantMessageId,
          body: 'An unexpected error occurred. Please try again later.',
          isLoading: false,
        });

        throw error;
      }
    }
  },
});
