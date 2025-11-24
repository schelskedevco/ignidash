import { betterFetch } from '@better-fetch/fetch';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import type { Session } from '@/convex/auth';

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>('/api/auth/get-session', {
    baseURL: request.nextUrl.origin,
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  });

  const isAuthPage = ['/signin', '/signup', '/forgot-password'].some((path) => request.nextUrl.pathname.startsWith(path));
  if (session && isAuthPage) return NextResponse.redirect(new URL('/dashboard', request.url));

  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/settings');
  if (!session && isProtectedPage)
    return NextResponse.redirect(new URL(`/signin?redirect=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/signin', '/signup', '/forgot-password', '/dashboard/:path*', '/settings'],
};
