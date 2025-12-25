import { createAuthClient } from '@neondatabase/auth'
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters'

const authBaseUrl =
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ||
  'https://dummy-auth-url.neon.tech'

// Shared Neon Auth client for client components.
export const authClient = createAuthClient(authBaseUrl, {
  adapter: BetterAuthReactAdapter(),
})
