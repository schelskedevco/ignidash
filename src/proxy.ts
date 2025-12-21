import { NextResponse, type NextRequest } from 'next/server';

import { isAuthenticated as getIsAuthenticated } from '@/lib/auth-server';

export async function proxy(request: NextRequest) {
  const isAuthenticated = await getIsAuthenticated();

  const isAuthPage = ['/signin', '/signup', '/forgot-password'].some((path) => request.nextUrl.pathname.startsWith(path));
  if (isAuthenticated && isAuthPage) return NextResponse.redirect(new URL('/dashboard', request.url));

  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/settings');
  if (!isAuthenticated && isProtectedPage)
    return NextResponse.redirect(new URL(`/signin?redirect=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/signin', '/signup', '/forgot-password', '/dashboard/:path*', '/settings'],
};
