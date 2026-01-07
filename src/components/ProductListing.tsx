'use client'

import type { StoreProduct } from '@/types/product'
import { useEffect, useState } from 'react'
import { Skeleton } from './ui/skeleton'
import Link from 'next/link'
import { cn, formatPrice } from '@/lib/utils'
import { PRODUCT_CATEGORIES } from '@/config'
import ImageSlider from './ImageSlider'

interface ProductListingProps {
  product: StoreProduct | null
  index: number
}

const ProductListing = ({
  product,
  index,
}: ProductListingProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, index * 75)

    return () => clearTimeout(timer)
  }, [index])

  if (!product || !isVisible) return <ProductPlaceholder />

  const label = PRODUCT_CATEGORIES.find(
    ({ value }) => value === product.category
  )?.label

  const validUrls = product.images
    .map((image) => image.url)
    .filter(Boolean) as string[]

  if (isVisible && product) {
    return (
      <Link
        className={cn(
          'invisible h-full w-full cursor-pointer group/main',
          {
            'visible animate-in fade-in-5': isVisible,
          }
        )}
        href={`/product/${product.id}`}>
        <div className='flex flex-col w-full hover-lift bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all'>
          <ImageSlider urls={validUrls} />

          <div className='p-4'>
            <h3 className='mt-2 font-semibold text-sm text-gray-900 group-hover/main:text-blue-600 transition-colors'>
              {product.name}
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              {label}
            </p>
            <p className='mt-2 font-semibold text-sm bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
              {formatPrice(product.price)}
            </p>
          </div>
        </div>
      </Link>
    )
  }
}

const ProductPlaceholder = () => {
  return (
    <div className='flex flex-col w-full bg-white rounded-xl overflow-hidden border border-gray-100'>
      <div className='relative bg-zinc-100 aspect-square w-full overflow-hidden'>
        <Skeleton className='h-full w-full' />
      </div>
      <div className='p-4'>
        <Skeleton className='mt-2 w-2/3 h-4 rounded-lg' />
        <Skeleton className='mt-2 w-16 h-4 rounded-lg' />
        <Skeleton className='mt-2 w-12 h-4 rounded-lg' />
      </div>
    </div>
  )
}

export default ProductListing
