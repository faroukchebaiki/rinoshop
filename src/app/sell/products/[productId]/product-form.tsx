'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PRODUCT_CATEGORIES } from '@/config'
import { trpc } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  ProductValidator,
  type TProductValidator,
} from '@/lib/validators/product-validator'

type EditProduct = {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  approvedForSale: 'PENDING' | 'APPROVED' | 'DENIED'
}

const EditProductForm = ({
  product,
}: {
  product: EditProduct
}) => {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TProductValidator>({
    resolver: zodResolver(ProductValidator),
    defaultValues: {
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      category: product.category,
    },
  })

  const { mutate: updateProduct, isPending } =
    trpc.seller.updateProduct.useMutation({
      onSuccess: () => {
        toast.success('Product updated.')
        router.push('/sell')
        router.refresh()
      },
      onError: (error) => {
        toast.error(
          error.message || 'Update failed.'
        )
      },
    })

  const isLocked = product.approvedForSale === 'APPROVED'

  const onSubmit = (values: TProductValidator) => {
    updateProduct({
      productId: product.id,
      ...values,
    })
  }

  return (
    <div className='max-w-2xl'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900'>
            Edit product
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Update details before the product is approved.
          </p>
        </div>
        <Link
          href='/sell'
          className='text-sm font-medium text-blue-600 hover:text-blue-500'>
          Back to dashboard
        </Link>
      </div>

      {isLocked ? (
        <div className='mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700'>
          Approved products are locked for now.
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className='mt-8 grid gap-4'>
        <div className='grid gap-1'>
          <Label htmlFor='name'>Product name</Label>
          <Input
            id='name'
            {...register('name')}
            disabled={isLocked}
            className={cn({
              'focus-visible:ring-red-500':
                errors.name,
            })}
          />
          {errors.name ? (
            <p className='text-sm text-red-500'>
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className='grid gap-1'>
          <Label htmlFor='category'>Category</Label>
          <select
            id='category'
            {...register('category')}
            disabled={isLocked}
            className={cn(
              'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              {
                'border-red-500 focus-visible:ring-red-500':
                  errors.category,
              }
            )}>
            {PRODUCT_CATEGORIES.map((category) => (
              <option
                key={category.value}
                value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category ? (
            <p className='text-sm text-red-500'>
              {errors.category.message}
            </p>
          ) : null}
        </div>

        <div className='grid gap-1'>
          <Label htmlFor='price'>Price (USD)</Label>
          <Input
            id='price'
            type='number'
            min={1}
            step={0.01}
            {...register('price', {
              valueAsNumber: true,
            })}
            disabled={isLocked}
            className={cn({
              'focus-visible:ring-red-500':
                errors.price,
            })}
          />
          {errors.price ? (
            <p className='text-sm text-red-500'>
              {errors.price.message}
            </p>
          ) : null}
        </div>

        <div className='grid gap-1'>
          <Label htmlFor='description'>Description</Label>
          <textarea
            id='description'
            rows={4}
            {...register('description')}
            disabled={isLocked}
            className={cn(
              'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              {
                'border-red-500 focus-visible:ring-red-500':
                  errors.description,
              }
            )}
          />
          {errors.description ? (
            <p className='text-sm text-red-500'>
              {errors.description.message}
            </p>
          ) : null}
        </div>

        <Button
          type='submit'
          className='w-fit'
          disabled={isPending || isLocked}>
          {isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </div>
  )
}

export default EditProductForm
