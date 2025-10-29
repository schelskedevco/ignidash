import { betterFetch } from '@better-fetch/fetch';
import type { Session } from '@/convex/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>('/api/auth/get-session', {
    baseURL: request.nextUrl.origin,
    headers: {
      cookie: request.headers.get('cookie') || '', // Forward the cookies from the request
    },
  });

  if (session) {
    return NextResponse.redirect(new URL('/dashboard/quick-plan', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/signin', '/signup', '/forgot-password'],
};
