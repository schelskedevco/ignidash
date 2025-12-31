import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { authComponent, createAuth } from './auth';

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
  path: '/createDefaultPlan',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CONVEX_API_SECRET}`) return new Response('Unauthorized', { status: 401 });

    const { userId, userName } = await request.json();
    if (!userId) return new Response('Missing userId', { status: 400 });

    await ctx.runMutation(internal.plans.internalGetOrCreateDefaultPlan, { userId, userName });
    return new Response('OK', { status: 200 });
  }),
});

http.route({
  path: '/deleteUserData',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CONVEX_API_SECRET}`) return new Response('Unauthorized', { status: 401 });

    const { userId } = await request.json();
    if (!userId) return new Response('Missing userId', { status: 400 });

    await ctx.runMutation(internal.app_data.deleteAppDataForUser, { userId });
    return new Response('OK', { status: 200 });
  }),
});

http.route({
  path: '/captureSignUp',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CONVEX_API_SECRET}`) return new Response('Unauthorized', { status: 401 });

    const { userId, method, email, name } = await request.json();
    if (!userId || !method || !email) return new Response('Missing required fields', { status: 400 });

    await ctx.runAction(internal.posthog.captureSignUp, { userId, method, email, name });
    return new Response('OK', { status: 200 });
  }),
});

http.route({
  path: '/captureSignIn',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CONVEX_API_SECRET}`) return new Response('Unauthorized', { status: 401 });

    const { userId, method } = await request.json();
    if (!userId || !method) return new Response('Missing required fields', { status: 400 });

    await ctx.runAction(internal.posthog.captureSignIn, { userId, method });
    return new Response('OK', { status: 200 });
  }),
});

export default http;
