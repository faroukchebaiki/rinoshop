import type { Request, Response } from 'express'
import type { User } from '../generated/client'
import { neonAuth } from '@neondatabase/auth/next/server'
import { prisma } from '@/lib/db'
import {
  fetchNeonSession,
  type NeonAuthUser,
} from './auth/neon-session'

export type AuthState = {
  session: unknown | null
  authUser: NeonAuthUser | null
  user: User | null
}

const normalizeEmail = (email?: string | null) =>
  email?.trim().toLowerCase() ?? null

// Splits a combined set-cookie header into individual cookies.
const splitSetCookieHeader = (headerValue: string) => {
  const cookies: string[] = []
  let start = 0
  let inExpires = false

  for (let i = 0; i < headerValue.length; i += 1) {
    const char = headerValue[i]

    if (
      headerValue
        .slice(i, i + 8)
        .toLowerCase() === 'expires='
    ) {
      inExpires = true
    }

    if (char === ';') {
      inExpires = false
    }

    if (char === ',' && !inExpires) {
      const cookie = headerValue.slice(start, i).trim()
      if (cookie) cookies.push(cookie)
      start = i + 1
    }
  }

  const lastCookie = headerValue.slice(start).trim()
  if (lastCookie) cookies.push(lastCookie)

  return cookies
}

const applySetCookies = (
  res: Response,
  headerValue: string | null
) => {
  if (!headerValue) return
  const cookies = splitSetCookieHeader(headerValue)
  if (cookies.length > 0) {
    res.setHeader('set-cookie', cookies)
  }
}

// Ensures there's a matching Prisma user for the Neon Auth identity.
const syncUser = async (authUser: NeonAuthUser) => {
  if (!authUser.id || !authUser.email) return null

  const email = normalizeEmail(authUser.email)
  if (!email) return null

  // 1. Try to find by Neon Auth ID first (most reliable)
  const existingByAuthId = await prisma.user.findUnique({
    where: { neonAuthId: authUser.id },
  })

  if (existingByAuthId) {
    // Update email if it changed in Neon Auth
    if (existingByAuthId.email !== email) {
      return prisma.user.update({
        where: { id: existingByAuthId.id },
        data: { email },
      })
    }
    return existingByAuthId
  }

  // 2. Fallback: Find by email and link Neon Auth ID
  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  })

  if (existingByEmail) {
    if (existingByEmail.neonAuthId !== authUser.id) {
      return prisma.user.update({
        where: { id: existingByEmail.id },
        data: { neonAuthId: authUser.id },
      })
    }
    return existingByEmail
  }

  // 3. Create new user
  return prisma.user.create({
    data: {
      email,
      neonAuthId: authUser.id,
      role: 'USER',
    },
  })
}

// Reads the current session in server components and maps it to a Prisma user.
export const getServerSideAuth =
  async (): Promise<AuthState> => {
    const { session, user: authUser } = await neonAuth()

    if (!authUser) {
      return { session: null, authUser: null, user: null }
    }

    const user = await syncUser(authUser)

    return { session, authUser, user }
  }

// Loads the session for Express requests and refreshes cookies when needed.
export const getAuthSessionFromRequest = async (
  req: Request,
  res?: Response
): Promise<AuthState> => {
  const origin =
    req.headers.origin ??
    `${req.protocol}://${req.get('host')}`
  const { session, user: authUser, setCookie } =
    await fetchNeonSession({
      cookieHeader: req.headers.cookie,
      origin,
    })

  if (res) {
    applySetCookies(res, setCookie)
  }

  if (!authUser) {
    return { session: null, authUser: null, user: null }
  }

  const user = await syncUser(authUser)

  return { session, authUser, user }
}

// Resolves Neon Auth session data from a raw cookie header.
export const getAuthSessionFromHeaders = async ({
  cookieHeader,
  origin,
}: {
  cookieHeader?: string | null
  origin?: string
}): Promise<AuthState> => {
  const { session, user: authUser } = await fetchNeonSession({
    cookieHeader,
    origin,
  })

  if (!authUser) {
    return { session: null, authUser: null, user: null }
  }

  const user = await syncUser(authUser)

  return { session, authUser, user }
}
