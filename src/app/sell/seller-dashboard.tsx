'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PRODUCT_CATEGORIES } from '@/config'
import { trpc } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, formatPrice } from '@/lib/utils'
import {
  ProductValidator,
  type TProductValidator,
} from '@/lib/validators/product-validator'

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  DENIED: 'bg-rose-50 text-rose-700',
}

const SellerDashboard = ({
  isAdmin,
}: {
  isAdmin: boolean
}) => {
  const [actionProductId, setActionProductId] =
    useState<string | null>(null)

  const {
    data: products,
    isLoading: isLoadingProducts,
    refetch: refetchProducts,
  } = trpc.seller.listProducts.useQuery()

  const {
    data: pendingProducts,
    isLoading: isLoadingPending,
    refetch: refetchPending,
  } = trpc.admin.listPendingProducts.useQuery(undefined, {
    enabled: isAdmin,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TProductValidator>({
    resolver: zodResolver(ProductValidator),
    defaultValues: {
      category: PRODUCT_CATEGORIES[0]?.value,
      price: 9,
      description: '',
    },
  })

  const { mutate: createProduct, isPending: isCreating } =
    trpc.seller.createProduct.useMutation({
      onSuccess: () => {
        toast.success('Product created.')
        reset({
          name: '',
          category: PRODUCT_CATEGORIES[0]?.value,
          price: 9,
          description: '',
        })
        refetchProducts()
      },
      onError: (error) => {
        toast.error(
          error.message || 'Could not create product.'
        )
      },
    })

  const {
    mutate: approveProduct,
    isPending: isApproving,
  } = trpc.admin.approveProduct.useMutation({
    onSuccess: () => {
      toast.success('Product approved.')
      refetchPending()
      refetchProducts()
    },
    onError: (error) => {
      toast.error(
        error.message || 'Approval failed.'
      )
    },
    onSettled: () => setActionProductId(null),
  })

  const { mutate: denyProduct, isPending: isDenying } =
    trpc.admin.denyProduct.useMutation({
      onSuccess: () => {
        toast.success('Product denied.')
        refetchPending()
        refetchProducts()
      },
      onError: (error) => {
        toast.error(error.message || 'Deny failed.')
      },
      onSettled: () => setActionProductId(null),
    })

  const categoryLabelMap = useMemo(() => {
    return new Map<string, string>(
      PRODUCT_CATEGORIES.map((category) => [
        category.value,
        category.label,
      ])
    )
  }, [])

  const onSubmit = (values: TProductValidator) => {
    createProduct(values)
  }

  return (
    <div className='mt-10 space-y-12'>
      <section className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <h2 className='text-xl font-semibold text-gray-900'>
          Create a new product
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Start with the basics. Uploads come next.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className='mt-6 grid gap-4'>
          <div className='grid gap-1'>
            <Label htmlFor='name'>Product name</Label>
            <Input
              id='name'
              placeholder='e.g. Minimal UI Kit'
              {...register('name')}
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
              className={cn(
                'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                {
                  'border-red-500 focus-visible:ring-red-500':
                    errors.description,
                }
              )}
              placeholder='Describe your product...'
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
            disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create product'}
          </Button>
        </form>
      </section>

      <section className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Your products
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Track status and update pending items.
            </p>
          </div>
        </div>

        <div className='mt-6 space-y-4'>
          {isLoadingProducts ? (
            <p className='text-sm text-muted-foreground'>
              Loading products...
            </p>
          ) : products && products.length > 0 ? (
            products.map((product) => {
              const label =
                categoryLabelMap.get(product.category) ??
                product.category
              const canEdit =
                product.approvedForSale !== 'APPROVED'

              return (
                <div
                  key={product.id}
                  className='flex flex-col gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='space-y-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h3 className='text-base font-semibold text-gray-900'>
                        {product.name}
                      </h3>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-medium',
                          STATUS_STYLES[
                            product.approvedForSale
                          ] ?? 'bg-gray-100 text-gray-700'
                        )}>
                        {product.approvedForSale}
                      </span>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {label} · {formatPrice(product.price)}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {product.productFile?.url
                        ? 'File uploaded'
                        : 'File not uploaded yet'}
                    </p>
                  </div>

                  <div className='flex items-center gap-3'>
                    <Link
                      href={`/sell/products/${product.id}`}
                      className={cn(
                        'text-sm font-medium text-blue-600 hover:text-blue-500',
                        !canEdit &&
                          'pointer-events-none opacity-50'
                      )}>
                      Edit
                    </Link>
                  </div>
                </div>
              )
            })
          ) : (
            <p className='text-sm text-muted-foreground'>
              No products yet. Create one to get started.
            </p>
          )}
        </div>
      </section>

      {isAdmin ? (
        <section className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Pending approvals
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Review and approve new listings.
          </p>

          <div className='mt-6 space-y-4'>
            {isLoadingPending ? (
              <p className='text-sm text-muted-foreground'>
                Loading pending products...
              </p>
            ) : pendingProducts &&
              pendingProducts.length > 0 ? (
              pendingProducts.map((product) => (
                <div
                  key={product.id}
                  className='flex flex-col gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='space-y-1'>
                    <h3 className='text-base font-semibold text-gray-900'>
                      {product.name}
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      {categoryLabelMap.get(
                        product.category
                      ) ?? product.category}{' '}
                      · {formatPrice(product.price)}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Seller: {product.user.email}
                    </p>
                  </div>

                  <div className='flex gap-3'>
                    <Button
                      type='button'
                      size='sm'
                      onClick={() => {
                        setActionProductId(product.id)
                        approveProduct({
                          productId: product.id,
                        })
                      }}
                      disabled={
                        isApproving ||
                        isDenying ||
                        actionProductId === product.id
                      }>
                      Approve
                    </Button>
                    <Button
                      type='button'
                      variant='secondary'
                      size='sm'
                      onClick={() => {
                        setActionProductId(product.id)
                        denyProduct({
                          productId: product.id,
                        })
                      }}
                      disabled={
                        isApproving ||
                        isDenying ||
                        actionProductId === product.id
                      }>
                      Deny
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>
                No pending products.
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default SellerDashboard
