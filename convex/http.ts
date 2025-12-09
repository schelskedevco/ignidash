import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { authComponent, createAuth } from './auth';

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

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

export default http;
