import { NextRequest, NextResponse } from 'next/server'
import { fetchNeonSession } from './lib/auth/neon-session'

export async function middleware(req: NextRequest) {
  const { nextUrl } = req

  if (!['/sign-in', '/sign-up'].includes(nextUrl.pathname)) {
    return NextResponse.next()
  }

  const { session } = await fetchNeonSession({
    cookieHeader: req.headers.get('cookie'),
    origin: nextUrl.origin,
  })

  // Redirect authenticated users away from auth routes.
  if (session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}
