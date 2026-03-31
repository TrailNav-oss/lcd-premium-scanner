import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const start = Date.now()
  const requestId = crypto.randomUUID().slice(0, 8)

  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)

  // Structured JSON log — visible in Vercel logs and local terminal
  const duration = Date.now() - start
  const logLine = JSON.stringify({
    level: 'info',
    msg: 'request',
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    search: request.nextUrl.search || undefined,
    ua: request.headers.get('user-agent')?.slice(0, 80),
    duration: `${duration}ms`,
    ts: new Date().toISOString(),
  })

  console.log(logLine)

  return response
}

// Apply to API routes and pages only — skip static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
