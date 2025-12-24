import type { Prisma } from '@prisma/client'
import type { StoreProduct } from '@/types/product'

export const productSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  category: true,
  productFile: {
    select: {
      id: true,
      url: true,
      filename: true,
      mimeType: true,
    },
  },
  images: {
    orderBy: { sortOrder: 'asc' },
    select: {
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
} satisfies Prisma.ProductSelect

export type ProductRecord = Prisma.ProductGetPayload<{
  select: typeof productSelect
}>

// Normalizes Prisma product records into the UI-friendly shape.
export const mapProductRecord = (
  product: ProductRecord
): StoreProduct => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  category: product.category,
  images: product.images.map(({ media }) => media),
  productFile: product.productFile ?? null,
})
