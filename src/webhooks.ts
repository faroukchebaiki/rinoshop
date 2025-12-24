import express from 'express'
import type Stripe from 'stripe'
import { WebhookRequest } from './server/express-app'
import { stripe } from './lib/stripe'
import { prisma } from './lib/db'
import { Resend } from 'resend'
import { ReceiptEmailHtml } from './components/emails/ReceiptEmail'
import { mapProductRecord, productSelect } from './lib/products'

const resend = new Resend(process.env.RESEND_API_KEY)

type OrderMetadata = {
  userId: string
  orderId: string
}

// Extracts order identifiers from Stripe metadata.
const readOrderMetadata = (
  metadata?: Stripe.Metadata
): OrderMetadata | null => {
  const userId = metadata?.userId
  const orderId = metadata?.orderId

  if (!userId || !orderId) return null

  return { userId, orderId }
}

// Loads the Prisma order and user for a given checkout session.
const loadOrderWithUser = async ({
  userId,
  orderId,
}: OrderMetadata) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: {
        include: {
          product: {
            select: productSelect,
          },
        },
      },
    },
  })

  if (!order || order.userId !== userId) {
    return { order: null, user: null }
  }

  return { order, user: order.user }
}

// Updates the paid status for an order.
const setOrderPaidStatus = async (
  orderId: string,
  isPaid: boolean
) => {
  await prisma.order.update({
    where: { id: orderId },
    data: { isPaid },
  })
}

// Resolves order metadata from a refunded charge or its payment intent.
const resolveMetadataFromCharge = async (
  charge: Stripe.Charge
) => {
  const direct = readOrderMetadata(charge.metadata)

  if (direct) return direct

  if (
    !charge.payment_intent ||
    typeof charge.payment_intent !== 'string'
  ) {
    return null
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(
    charge.payment_intent
  )

  return readOrderMetadata(paymentIntent.metadata)
}

// Handles Stripe checkout completion and sends a receipt email.
export const stripeWebhookHandler = async (
  req: express.Request,
  res: express.Response
) => {
  const webhookRequest = req as any as WebhookRequest
  const body = webhookRequest.rawBody
  const signature = req.headers['stripe-signature'] || ''

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err) {
    return res
      .status(400)
      .send(
        `Webhook Error: ${err instanceof Error
          ? err.message
          : 'Unknown Error'
        }`
      )
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data
      .object as Stripe.Checkout.Session
    const metadata = readOrderMetadata(session.metadata ?? undefined)

    if (!metadata) {
      return res
        .status(400)
        .send(
          'Webhook Error: Missing order metadata on session'
        )
    }

    const { order, user } = await loadOrderWithUser(
      metadata
    )

    if (!user) {
      return res
        .status(404)
        .json({ error: 'No such user exists.' })
    }

    if (!order) {
      return res
        .status(404)
        .json({ error: 'No such order exists.' })
    }

    const wasPaid = order.isPaid

    if (!wasPaid) {
      await setOrderPaidStatus(metadata.orderId, true)
    }

    if (wasPaid) {
      return res.status(200).send()
    }

    const products = order.items.map((item) => ({
      ...mapProductRecord(item.product),
      price: item.price,
    }))

    // Send receipt email for successful payments.
    try {
      const html = await ReceiptEmailHtml({
        date: new Date(),
        email: user.email,
        orderId: metadata.orderId,
        products,
      })

      const data = await resend.emails.send({
        from: 'Rinoshop <hello@rinoshop.com>',
        to: [user.email],
        subject:
          'Thanks for your order! This is your receipt.',
        html,
      })
      return res.status(200).json({ data })
    } catch (error) {
      return res.status(500).json({ error })
    }
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data
      .object as Stripe.Checkout.Session
    const metadata = readOrderMetadata(session.metadata ?? undefined)

    if (metadata) {
      const { order } = await loadOrderWithUser(metadata)

      if (order) {
        await setOrderPaidStatus(metadata.orderId, false)
      }
    }

    return res.status(200).send()
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge
    const metadata = await resolveMetadataFromCharge(charge)

    if (metadata) {
      const { order } = await loadOrderWithUser(metadata)

      if (order) {
        await setOrderPaidStatus(metadata.orderId, false)
      }
    }

    return res.status(200).send()
  }

  return res.status(200).send()
}
