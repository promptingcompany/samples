import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Track all visits to blog posts
  if (pathname.startsWith('/blog/') && pathname !== '/blog') {
    const slug = pathname.replace('/blog/', '');

    // Fire analytics event in the background (non-blocking)
    // This is the "proxy via Middleware" pattern
    fetch(`${request.nextUrl.origin}/api/analytics/page-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'page_visit',
        page: {
          href: request.nextUrl.href,
          pathname: pathname,
          // In a real app, you would fetch the actual title
          title: `Blog: ${slug}`,
        },
        request: {
          referrer: request.headers.get('referer'),
          userAgent: request.headers.get('user-agent'),
          method: request.method,
        },
        // You can pass session/anonymous IDs from cookies if available
      }),
      keepalive: true,
    }).catch(() => {
      // Never let analytics break the user experience
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
