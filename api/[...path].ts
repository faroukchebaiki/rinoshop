import type { IncomingMessage, ServerResponse } from 'http'
import { createExpressApp } from '../src/server/express-app'

let cachedApp: ReturnType<typeof createExpressApp> | null =
  null

// Disable Vercel's default body parsing so Stripe signature checks work.
export const config = {
  api: {
    bodyParser: false,
  },
}

// Routes all /api/* traffic through the shared Express app.
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (!cachedApp) {
    cachedApp = createExpressApp()
  }

  return cachedApp(req, res)
}
