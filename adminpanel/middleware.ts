import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  console.log('Middleware: pathname=', pathname, 'token=', token ? 'present' : 'missing');

  // Allow access to login page, API routes, and static files
  if (pathname === '/login' || 
      pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.includes('_rsc=')) {
    return NextResponse.next();
  }

  // Redirect to login if no token for protected routes
  if (!token) {
    console.log('Middleware: No token found, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  console.log('Middleware: Token found, allowing access');
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};