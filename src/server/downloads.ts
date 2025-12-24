import { Request, Response } from 'express'
import { prisma } from '../lib/db'
import { getAuthSessionFromRequest } from '../lib/auth'

// Ensures a user has purchased a product before granting access to its file.
export const downloadHandler = async (
    req: Request,
    res: Response
) => {
    const { productId } = req.params
    const { user } = await getAuthSessionFromRequest(req, res)

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

    // Redirect to the secure Vercel Blob URL.
    return res.redirect(product.productFile.url)
}
