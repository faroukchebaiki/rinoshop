import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { adminProcedure, router } from './trpc'

const productIdSchema = z.object({
  productId: z.string().uuid(),
})

export const adminRouter = router({
  listPendingProducts: adminProcedure.query(async () => {
    return prisma.product.findMany({
      where: { approvedForSale: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        createdAt: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    })
  }),
  approveProduct: adminProcedure
    .input(productIdSchema)
    .mutation(async ({ input }) => {
      const product = await prisma.product.findUnique({
        where: { id: input.productId },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stripeId: true,
          priceId: true,
          approvedForSale: true,
        },
      })

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      if (
        product.approvedForSale === 'APPROVED' &&
        product.priceId &&
        product.stripeId
      ) {
        return { status: 'already-approved' }
      }

      if (!Number.isFinite(product.price)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid product price.',
        })
      }

      const unitAmount = Math.round(product.price * 100)

      if (unitAmount < 100) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Price must be at least $1.',
        })
      }

      let stripeProductId = product.stripeId ?? null
      let stripePriceId = product.priceId ?? null

      try {
        if (!stripeProductId) {
          const stripeProduct = await stripe.products.create({
            name: product.name,
            description: product.description ?? undefined,
            metadata: {
              productId: product.id,
            },
          })

          stripeProductId = stripeProduct.id
        }

        if (!stripePriceId) {
          const stripePrice = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: unitAmount,
            currency: 'usd',
          })

          stripePriceId = stripePrice.id
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe approval failed.',
          cause: error,
        })
      }

      await prisma.product.update({
        where: { id: product.id },
        data: {
          approvedForSale: 'APPROVED',
          stripeId: stripeProductId,
          priceId: stripePriceId,
        },
      })

      return { status: 'approved' }
    }),
  denyProduct: adminProcedure
    .input(productIdSchema)
    .mutation(async ({ input }) => {
      const product = await prisma.product.findUnique({
        where: { id: input.productId },
        select: { id: true },
      })

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      await prisma.product.update({
        where: { id: input.productId },
        data: { approvedForSale: 'DENIED' },
      })

      return { status: 'denied' }
    }),
})
