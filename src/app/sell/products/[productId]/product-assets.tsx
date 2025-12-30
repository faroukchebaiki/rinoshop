'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { upload } from '@vercel/blob/client'
import { toast } from 'sonner'
import { trpc } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const sanitizeFilename = (filename: string) =>
  filename.replace(/[^a-zA-Z0-9._-]/g, '-')

const buildPathname = (
  productId: string,
  filename: string
) => {
  const safeName = sanitizeFilename(filename)
  return `products/${productId}/${safeName}`
}

const ProductAssets = ({
  productId,
  isLocked,
}: {
  productId: string
  isLocked: boolean
}) => {
  const [isUploadingImages, setIsUploadingImages] =
    useState(false)
  const [isUploadingFile, setIsUploadingFile] =
    useState(false)

  const { data, isLoading, refetch } =
    trpc.seller.getProduct.useQuery({
      productId,
    })

  const images = useMemo(() => {
    if (!data?.images) return []
    return data.images.map((image) => image.media)
  }, [data?.images])

  const handleImageUpload = async (
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return

    setIsUploadingImages(true)

    try {
      for (const file of Array.from(files)) {
        await upload(
          buildPathname(productId, file.name),
          file,
          {
            access: 'public',
            handleUploadUrl: '/api/blob/upload',
            contentType: file.type,
            clientPayload: JSON.stringify({
              kind: 'media',
              productId,
            }),
          }
        )
      }

      toast.success('Images uploaded.')
      refetch()
    } catch (error) {
      toast.error('Image upload failed.')
    } finally {
      setIsUploadingImages(false)
    }
  }

  const handleFileUpload = async (
    files: FileList | null
  ) => {
    const file = files?.[0]
    if (!file) return

    setIsUploadingFile(true)

    try {
      await upload(buildPathname(productId, file.name), file, {
        access: 'public',
        handleUploadUrl: '/api/blob/upload',
        contentType: file.type,
        clientPayload: JSON.stringify({
          kind: 'product-file',
          productId,
        }),
      })

      toast.success('Product file uploaded.')
      refetch()
    } catch (error) {
      toast.error('File upload failed.')
    } finally {
      setIsUploadingFile(false)
    }
  }

  return (
    <section className='mt-12 space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
      <div>
        <h2 className='text-xl font-semibold text-gray-900'>
          Product assets
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Upload your product file and gallery images.
        </p>
        {isLocked ? (
          <p className='mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700'>
            This product is approved. Uploads are locked for now.
          </p>
        ) : null}
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-sm font-medium text-gray-900'>
              Product file
            </p>
            <p className='text-sm text-muted-foreground'>
              {isLoading
                ? 'Loading...'
                : data?.productFile?.filename ??
                  'No file uploaded yet.'}
            </p>
          </div>

          <label
            className={cn(
              'inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300',
              isLocked && 'pointer-events-none opacity-50'
            )}>
            <input
              type='file'
              className='hidden'
              onChange={(event) =>
                handleFileUpload(event.target.files)
              }
              disabled={isLocked || isUploadingFile}
            />
            {isUploadingFile ? 'Uploading...' : 'Upload file'}
          </label>
        </div>

        <div className='border-t border-gray-100 pt-4'>
          <p className='text-sm font-medium text-gray-900'>
            Gallery images
          </p>
          <p className='text-sm text-muted-foreground'>
            {images.length > 0
              ? `${images.length} image(s) uploaded`
              : 'No images uploaded yet.'}
          </p>

          <div className='mt-4 flex flex-wrap gap-3'>
            {images.map((image) => (
              <div
                key={image.id}
                className='relative h-16 w-16 overflow-hidden rounded-md border border-gray-200 bg-gray-50'>
                {image.url ? (
                  <Image
                    src={image.url}
                    alt={image.filename ?? 'Product image'}
                    fill
                    sizes='64px'
                    className='object-cover'
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className='mt-4'>
            <label
              className={cn(
                'inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300',
                isLocked && 'pointer-events-none opacity-50'
              )}>
              <input
                type='file'
                accept='image/*'
                multiple
                className='hidden'
                onChange={(event) =>
                  handleImageUpload(event.target.files)
                }
                disabled={isLocked || isUploadingImages}
              />
              {isUploadingImages
                ? 'Uploading...'
                : 'Upload images'}
            </label>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductAssets
