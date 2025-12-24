import { z } from 'zod'
import {
  privateProcedure,
  publicProcedure,
  router,
} from './trpc'
import { TRPCError } from '@trpc/server'
import { stripe } from '../lib/stripe'
import type Stripe from 'stripe'
import { prisma } from '@/lib/db'

export const paymentRouter = router({
  createSession: privateProcedure
    .input(z.object({ productIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx
      let { productIds } = input

      if (productIds.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST' })
      }

      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
          approvedForSale: 'APPROVED',
        },
        select: {
          id: true,
          price: true,
          priceId: true,
        },
      })

      const filteredProducts = products.filter(
        (product) => Boolean(product.priceId)
      )

      if (filteredProducts.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST' })
      }

      const order = await prisma.order.create({
        data: {
          isPaid: false,
          userId: user.id,
          items: {
            create: filteredProducts.map((product) => ({
              productId: product.id,
              price: product.price,
            })),
          },
        },
      })

      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
        []

      filteredProducts.forEach((product) => {
        line_items.push({
          price: product.priceId!,
          quantity: 1,
        })
      })

      line_items.push({
        price: 'price_1OCeBwA19umTXGu8s4p2G3aX',
        quantity: 1,
        adjustable_quantity: {
          enabled: false,
        },
      })

      try {
        const stripeSession =
          await stripe.checkout.sessions.create({
            success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/cart`,
            payment_method_types: ['card', 'paypal'],
            mode: 'payment',
            metadata: {
              userId: user.id,
              orderId: order.id,
            },
            // Ensure the payment intent carries order metadata for refunds.
            payment_intent_data: {
              metadata: {
                userId: user.id,
                orderId: order.id,
              },
            },
            line_items,
          })

        return { url: stripeSession.url }
      } catch (err) {
        return { url: null }
      }
    }),
  pollOrderStatus: privateProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      const { orderId } = input

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { isPaid: true },
      })

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return { isPaid: order.isPaid }
    }),
})
