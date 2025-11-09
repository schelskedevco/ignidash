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
  if (session && isAuthPage) return NextResponse.redirect(new URL('/dashboard/simulator', request.url));

  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
  if (!session && isDashboardPage) return NextResponse.redirect(new URL('/signin', request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/signin', '/signup', '/forgot-password', '/dashboard/:path*'],
};
