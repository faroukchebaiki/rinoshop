import { Request, Response } from 'express'

// Proxies authentication requests to the Neon Auth server.
export const authProxyHandler = async (
    req: Request,
    res: Response
) => {
    const authUrl = process.env.NEON_AUTH_BASE_URL

    if (!authUrl) {
        return res
            .status(500)
            .json({ error: 'NEON_AUTH_BASE_URL is missing' })
    }

    const url = new URL(
        req.url.replace('/api/auth', ''),
        authUrl.endsWith('/') ? authUrl : `${authUrl}/`
    )

    try {
        const response = await fetch(url.toString(), {
            method: req.method,
            headers: {
                ...req.headers as any,
                host: new URL(authUrl).host,
            },
            body:
                req.method !== 'GET' && req.method !== 'HEAD'
                    ? (req as any).rawBody || req.body
                    : undefined,
        })

        const body = await response.arrayBuffer()

        res.status(response.status)
        response.headers.forEach((value, key) => {
            // Avoid forwarding compression headers that might cause issues.
            if (key.toLowerCase() !== 'content-encoding') {
                res.setHeader(key, value)
            }
        })

        res.send(Buffer.from(body))
    } catch (error) {
        console.error('Auth proxy error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}
