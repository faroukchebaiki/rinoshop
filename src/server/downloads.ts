import { Request, Response } from 'express'
import { Readable } from 'node:stream'
import { prisma } from '../lib/db'
import { getAuthSessionFromRequest } from '../lib/auth'
import { verifyDownloadToken } from '../lib/download-tokens'

const sanitizeFilename = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]/g, '-')

// Ensures a user has purchased a product before granting access to its file.
export const downloadHandler = async (
    req: Request,
    res: Response
) => {
    const { productId } = req.params
    const token =
        typeof req.query.token === 'string'
            ? req.query.token
            : null
    const tokenPayload = token
        ? verifyDownloadToken(token)
        : null
    const tokenValid =
        tokenPayload?.productId === productId

    if (!tokenValid) {
        const { user } = await getAuthSessionFromRequest(
            req,
            res
        )

        if (!user) {
            return res.status(401).send('Unauthorized')
        }

        // Check for a paid order that includes this product.
        const order = await prisma.order.findFirst({
            where: {
                userId: user.id,
                isPaid: true,
                items: {
                    some: {
                        productId,
                    },
                },
            },
        })

        if (!order) {
            return res.status(403).send('Forbidden')
        }
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { productFile: true },
    })

    if (
        !product ||
        !product.productFile ||
        !product.productFile.url
    ) {
        return res.status(404).send('Not Found')
    }

    const upstream = await fetch(product.productFile.url)

    if (!upstream.ok || !upstream.body) {
        return res.status(502).send('Download unavailable')
    }

    const filename = sanitizeFilename(
        product.productFile.filename ??
            `${product.name}.zip`
    )
    const contentType =
        upstream.headers.get('content-type') ||
        product.productFile.mimeType ||
        'application/octet-stream'
    const contentLength = upstream.headers.get(
        'content-length'
    )

    res.setHeader('Content-Type', contentType)
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
    )
    res.setHeader('Cache-Control', 'no-store')

    if (contentLength) {
        res.setHeader('Content-Length', contentLength)
    }

    const stream = Readable.fromWeb(
        upstream.body as any
    )

    stream.on('error', () => {
        if (!res.headersSent) {
            res.status(500).end()
        }
    })

    stream.pipe(res)
}
