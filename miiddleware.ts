// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check auth condition for protected routes
  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    const redirectUrl = new URL('/auth', request.url);
    // Add ?redirectTo= parameter to remember where the user was trying to go
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check if user has completed profile setup
  if (
    session &&
    !session.user.user_metadata?.profile_completed &&
    request.nextUrl.pathname !== '/profile-setup' &&
    !request.nextUrl.pathname.startsWith('/auth/') &&
    !isAuthRoute(request.nextUrl.pathname)
  ) {
    return NextResponse.redirect(new URL('/profile-setup', request.url));
  }

  // Redirect to dashboard if already logged in and trying to access auth pages
  if (session && isAuthRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

// Define protected routes that require authentication
function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

// Define auth routes that logged-in users shouldn't access
function isAuthRoute(pathname: string): boolean {
  const authRoutes = ['/login', '/signup', '/auth'];
  return authRoutes.some((route) => pathname.startsWith(route));
}

// Define which routes this middleware should be matched against
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
