'use node';

import { AzureOpenAI } from 'openai';
import { v } from 'convex/values';
import { action } from './_generated/server';

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

export const streamChat = action({
  args: {
    messages: v.array(
      v.object({
        content: v.string(),
        role: v.union(v.literal('system'), v.literal('user'), v.literal('assistant')),
      })
    ),
  },
  handler: async (ctx, { messages }) => {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
        stream: true,
      });

      return completion;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to get a streaming response from OpenAI: ${error}`);
    }
  },
});
