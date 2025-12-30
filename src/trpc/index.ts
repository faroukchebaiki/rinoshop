import { z } from 'zod'
import { publicProcedure, router } from './trpc'
import { QueryValidator } from '../lib/validators/query-validator'
import { paymentRouter } from './payment-router'
import { sellerRouter } from './seller-router'
import { adminRouter } from './admin-router'
import { prisma } from '@/lib/db'
import { mapProductRecord, productSelect } from '@/lib/products'
import type { Prisma } from '../generated/client'

export const appRouter = router({
  payment: paymentRouter,
  seller: sellerRouter,
  admin: adminRouter,

  getInfiniteProducts: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100),
        cursor: z.number().nullish(),
        query: QueryValidator,
      })
    )
    .query(async ({ input }) => {
      const { query, cursor, limit } = input
      const { sort, category } = query
      const page = cursor ?? 1
      const skip = (page - 1) * limit

      const where: Prisma.ProductWhereInput = {
        approvedForSale: 'APPROVED',
        ...(category ? { category } : {}),
      }

      const products = await prisma.product.findMany({
        where,
        orderBy: sort ? { createdAt: sort } : undefined,
        take: limit + 1,
        skip,
        select: productSelect,
      })

      const hasNextPage = products.length > limit
      const items = products
        .slice(0, limit)
        .map(mapProductRecord)

      return {
        items,
        nextPage: hasNextPage ? page + 1 : null,
      }
    }),
})

export type AppRouter = typeof appRouter
