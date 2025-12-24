import type { IncomingMessage } from 'http'
import express from 'express'
import bodyParser from 'body-parser'
import * as trpcExpress from '@trpc/server/adapters/express'
import { inferAsyncReturnType } from '@trpc/server'
import { appRouter } from '../trpc'
import { stripeWebhookHandler } from '../webhooks'
import { authProxyHandler } from './auth-proxy'
import { blobUploadHandler } from './blob-upload'
import { downloadHandler } from './downloads'
import { getAuthSessionFromRequest } from '../lib/auth'

// Builds the tRPC context from the Express request/response pair.
export const createContext = async ({
    req,
    res,
}: trpcExpress.CreateExpressContextOptions) => {
    const auth = await getAuthSessionFromRequest(req, res)

    return {
        req,
        res,
        auth,
    }
}

export type ExpressContext = inferAsyncReturnType<
    typeof createContext
>

// Adds a rawBody field for Stripe signature verification.
export type WebhookRequest = IncomingMessage & {
    rawBody: Buffer
}

// Creates an Express app with API routes used in both local dev and Vercel.
export const createExpressApp = () => {
    const app = express()

    const webhookMiddleware = bodyParser.json({
        verify: (req: WebhookRequest, _: any, buffer: Buffer) => {
            req.rawBody = buffer
        },
    })

    app.post(
        '/api/webhooks/stripe',
        webhookMiddleware,
        stripeWebhookHandler
    )

    app.use('/api/auth', express.raw({ type: '*/*' }), authProxyHandler)

    app.post(
        '/api/blob/upload',
        express.json({ limit: '25mb' }),
        blobUploadHandler
    )

    app.get('/api/download/:productId', downloadHandler)

    app.use(
        '/api/trpc',
        trpcExpress.createExpressMiddleware({
            router: appRouter,
            createContext,
        })
    )

    return app
}
