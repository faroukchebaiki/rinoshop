import type { Request, Response } from 'express'
import { handleUpload } from '@vercel/blob/client'
import { prisma } from '@/lib/db'
import { getAuthSessionFromRequest } from '@/lib/auth'

type UploadIntent = {
    kind?: 'media' | 'product-file'
    productId?: string
    userId?: string
    pathname?: string
}

const parsePayload = (payload: string | null) => {
    if (!payload) return {}
    try {
        return JSON.parse(payload) as UploadIntent
    } catch {
        return {}
    }
}

// Handles client token generation and upload callbacks for Vercel Blob.
export const blobUploadHandler = async (
    req: Request,
    res: Response
) => {
    try {
        const body = req.body

        if (!body || typeof body !== 'object') {
            return res
                .status(400)
                .json({ error: 'Missing upload payload' })
        }

        const result = await handleUpload({
            request: req,
            body,
            onBeforeGenerateToken: async (
                pathname,
                clientPayload
            ) => {
                const { user } = await getAuthSessionFromRequest(
                    req,
                    res
                )

                if (!user) {
                    throw new Error('Unauthorized')
                }

                const payload = parsePayload(clientPayload)
                const kind = payload.kind ?? 'media'

                if (payload.productId) {
                    const ownsProduct = await prisma.product.findFirst({
                        where: {
                            id: payload.productId,
                            userId: user.id,
                        },
                        select: { id: true },
                    })

                    if (!ownsProduct) {
                        throw new Error('Forbidden')
                    }
                }

                return {
                    allowedContentTypes:
                        kind === 'media' ? ['image/*'] : undefined,
                    addRandomSuffix: true,
                    tokenPayload: JSON.stringify({
                        kind,
                        productId: payload.productId ?? null,
                        userId: user.id,
                        pathname,
                    }),
                }
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                const payload = parsePayload(tokenPayload ?? null)
                const userId = payload.userId

                if (!userId) return

                const filename =
                    blob.pathname.split('/').pop() ?? blob.pathname
                const kind = payload.kind ?? 'media'

                if (kind === 'media') {
                    const media = await prisma.media.create({
                        data: {
                            userId,
                            url: blob.url,
                            filename,
                            mimeType: blob.contentType ?? null,
                        },
                    })

                    if (payload.productId) {
                        await prisma.productImage.create({
                            data: {
                                productId: payload.productId,
                                mediaId: media.id,
                            },
                        })
                    }
                }

                if (kind === 'product-file') {
                    const productFile =
                        await prisma.productFile.create({
                            data: {
                                userId,
                                url: blob.url,
                                filename,
                                mimeType: blob.contentType ?? null,
                            },
                        })

                    if (payload.productId) {
                        await prisma.product.update({
                            where: { id: payload.productId },
                            data: { productFileId: productFile.id },
                        })
                    }
                }
            },
        })

        return res.status(200).json(result)
    } catch (error) {
        return res.status(400).json({
            error:
                error instanceof Error
                    ? error.message
                    : 'Upload failed',
        })
    }
}
