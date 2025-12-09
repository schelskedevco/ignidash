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
};

export const streamChat = internalAction({
  handler: async (ctx, { messages, assistantMessageId }: StreamChatParams) => {
    const hasBody = (msg: Doc<'messages'>): msg is Doc<'messages'> & { body: string } => msg.body !== undefined;

    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: "You are a terse bot in a group chat responding to q's." },
          ...messages.filter(hasBody).map((msg) => ({ role: msg.author, content: msg.body })),
        ],
        stream: true,
      });

      let body = '';
      for await (const part of stream) {
        if (part.choices[0].delta?.content) {
          body += part.choices[0].delta.content;
          await ctx.runMutation(internal.messages.update, { messageId: assistantMessageId, body });
        }
      }
    } catch (error) {
      if (error instanceof AzureOpenAI.APIError) {
        console.error(error.status);
        console.error(error.message);

        await ctx.runMutation(internal.messages.update, { messageId: assistantMessageId, body: 'OpenAI call failed: ' + error.message });

        console.error(error);
      } else {
        throw error;
      }
    }
  },
});
