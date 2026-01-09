import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Allow public routes
    if (pathname.startsWith('/auth') || pathname.startsWith('/unauthorized')) {
      return NextResponse.next();
    }

    // Never redirect API requests; let route handlers return 401/403
    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    // Allow file requests (e.g. /logo.png) defensively
    if (pathname.includes('.')) {
      return NextResponse.next();
    }

    // If authenticated, allow all routes for now (role filtering temporarily disabled)
    // TODO: Re-enable role-based route protection once roles are properly configured
    if (token) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;

        // Allow auth pages even when unauthenticated
        if (pathname.startsWith('/auth') || pathname.startsWith('/unauthorized')) {
          return true;
        }

        // Never run auth checks on file requests
        if (pathname.includes('.')) {
          return true;
        }

        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|api/v1|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
