'use node';

import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

function getPostHogClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn('NEXT_PUBLIC_POSTHOG_KEY is not set, PostHog will not be initialized');
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

export const captureSignUp = internalAction({
  args: {
    userId: v.string(),
    method: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { userId, method, email, name }) => {
    const posthog = getPostHogClient();
    posthog?.capture({
      distinctId: userId,
      event: 'server_sign_up',
      properties: {
        method,
        $set: {
          email,
          name,
        },
      },
    });
  },
});

export const captureSignIn = internalAction({
  args: {
    userId: v.string(),
    method: v.string(),
  },
  handler: async (ctx, { userId, method }) => {
    const posthog = getPostHogClient();
    posthog?.capture({
      distinctId: userId,
      event: 'server_sign_in',
      properties: {
        method,
      },
    });
  },
});
