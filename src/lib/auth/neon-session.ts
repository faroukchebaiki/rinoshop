export type NeonAuthUser = {
  id: string
  email?: string | null
}

type NeonAuthSession = {
  session: unknown | null
  user: NeonAuthUser | null
}

const NEON_COOKIE_PREFIX = '__Secure-neon-auth'

// Filters request cookies down to the Neon Auth session cookies.
export const extractNeonAuthCookies = (
  cookieHeader?: string | null
) => {
  if (!cookieHeader) return ''

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.startsWith(NEON_COOKIE_PREFIX))
    .join('; ')
}

// Fetches the current Neon Auth session using the provided cookies.
export const fetchNeonSession = async ({
  cookieHeader,
  origin,
}: {
  cookieHeader?: string | null
  origin?: string
}): Promise<
  NeonAuthSession & { setCookie: string | null }
> => {
  const baseUrl = process.env.NEON_AUTH_BASE_URL

  if (!baseUrl) {
    throw new Error('NEON_AUTH_BASE_URL is missing')
  }

  const cookies = extractNeonAuthCookies(cookieHeader)

  if (!cookies) {
    return { session: null, user: null, setCookie: null }
  }

  const sessionUrl = new URL(
    'get-session',
    baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  )

  const response = await fetch(sessionUrl.toString(), {
    method: 'GET',
    headers: {
      Cookie: cookies,
      ...(origin ? { Origin: origin } : {}),
    },
  })

  const setCookie = response.headers.get('set-cookie')
  const data = (await response.json().catch(() => null)) as
    | NeonAuthSession
    | null

  if (!response.ok || !data) {
    return { session: null, user: null, setCookie }
  }

  return {
    session: data.session ?? null,
    user: data.user ?? null,
    setCookie,
  }
}
