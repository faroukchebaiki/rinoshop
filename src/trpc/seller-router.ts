import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { privateProcedure, router } from './trpc'
import {
  ProductUpdateValidator,
  ProductValidator,
} from '@/lib/validators/product-validator'

const sellerProductSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  category: true,
  approvedForSale: true,
  priceId: true,
  stripeId: true,
  createdAt: true,
  updatedAt: true,
  productFile: {
    select: {
      id: true,
      url: true,
      filename: true,
      mimeType: true,
    },
  },
}

export const sellerRouter = router({
  getProduct: privateProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const product = await prisma.product.findFirst({
        where: {
          id: input.productId,
          userId: ctx.user.id,
        },
        select: {
          ...sellerProductSelect,
          images: {
            orderBy: { sortOrder: 'asc' },
            select: {
              sortOrder: true,
              media: {
                select: {
                  id: true,
                  url: true,
                  filename: true,
                  width: true,
                  height: true,
                },
              },
            },
          },
        },
      })

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return product
    }),
  listProducts: privateProcedure.query(async ({ ctx }) => {
    return prisma.product.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
      select: sellerProductSelect,
    })
  }),
  createProduct: privateProcedure
    .input(ProductValidator)
    .mutation(async ({ ctx, input }) => {
      const description = input.description?.trim() || null

      return prisma.$transaction(async (tx) => {
        const productFile = await tx.productFile.create({
          data: {
            userId: ctx.user.id,
          },
          select: { id: true },
        })

        return tx.product.create({
          data: {
            userId: ctx.user.id,
            name: input.name.trim(),
            description,
            price: input.price,
            category: input.category,
            productFileId: productFile.id,
          },
          select: sellerProductSelect,
        })
      })
    }),
  updateProduct: privateProcedure
    .input(ProductUpdateValidator)
    .mutation(async ({ ctx, input }) => {
      const product = await prisma.product.findFirst({
        where: {
          id: input.productId,
          userId: ctx.user.id,
        },
        select: { approvedForSale: true },
      })

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      if (product.approvedForSale === 'APPROVED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Approved products cannot be edited yet.',
        })
      }

      const description = input.description?.trim() || null

      return prisma.product.update({
        where: { id: input.productId },
        data: {
          name: input.name.trim(),
          description,
          price: input.price,
          category: input.category,
        },
        select: sellerProductSelect,
      })
    }),
})
