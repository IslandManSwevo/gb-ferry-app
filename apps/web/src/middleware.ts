import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Feature flag: enable role enforcement by default; allow explicit opt-out in non-prod
const ENFORCE_ROLE_PROTECTION = process.env.NEXT_PUBLIC_ENFORCE_ROLE_PROTECTION !== 'false';

type RoleRule = { prefix: string; roles: string[] };

const ROLE_RULES: RoleRule[] = [
  { prefix: '/audit', roles: ['audit.view', 'audit.admin'] },
  { prefix: '/compliance', roles: ['compliance.view', 'compliance.admin'] },
  { prefix: '/crew', roles: ['crew.view', 'crew.admin'] },
  { prefix: '/passengers', roles: ['passengers.view', 'passengers.admin'] },
  { prefix: '/vessels', roles: ['vessels.view', 'vessels.admin'] },
  { prefix: '/settings', roles: ['settings.manage', 'admin'] },
];

const findRequiredRoles = (pathname: string): string[] | null => {
  const match = ROLE_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );
  return match ? match.roles : null;
};

const hasRequiredRole = (tokenRoles: unknown, required: string[] | null): boolean => {
  if (!required || required.length === 0) return true;
  const roles = Array.isArray(tokenRoles) ? (tokenRoles as string[]) : [];
  return required.some((role) => roles.includes(role));
};

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

    // If authenticated, enforce roles when enabled; otherwise allow
    if (token) {
      const requiredRoles = findRequiredRoles(pathname);

      if (ENFORCE_ROLE_PROTECTION && !hasRequiredRole(token?.roles, requiredRoles)) {
        const url = req.nextUrl.clone();
        url.pathname = '/unauthorized';
        return NextResponse.redirect(url);
      }

      return NextResponse.next();
    }
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
