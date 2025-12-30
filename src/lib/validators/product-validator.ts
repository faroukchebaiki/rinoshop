import { z } from 'zod'
import { PRODUCT_CATEGORIES } from '@/config'

const categoryValues = PRODUCT_CATEGORIES.map(
  (category) => category.value
) as [string, ...string[]]

export const ProductValidator = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(120, 'Name is too long.'),
  description: z
    .string()
    .max(2000, 'Description is too long.')
    .optional(),
  price: z
    .number()
    .min(1, 'Price must be at least $1.')
    .max(100000, 'Price is too high.'),
  category: z.enum(categoryValues, {
    message: 'Select a category.',
  }),
})

export type TProductValidator = z.infer<
  typeof ProductValidator
>

export const ProductUpdateValidator = ProductValidator.extend(
  {
    productId: z.string().uuid(),
  }
)

export type TProductUpdateValidator = z.infer<
  typeof ProductUpdateValidator
>
