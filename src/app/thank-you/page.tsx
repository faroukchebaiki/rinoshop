import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { PRODUCT_CATEGORIES } from '@/config'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import PaymentStatus from '@/components/PaymentStatus'
import { prisma } from '@/lib/db'
import { mapProductRecord, productSelect } from '@/lib/products'
import { getServerSideAuth } from '@/lib/auth'

interface PageProps {
  searchParams: {
    [key: string]: string | string[] | undefined
  }
}

const ThankYouPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const params = await searchParams
  const orderId = params.orderId
  const { user } = await getServerSideAuth()

  if (!orderId || typeof orderId !== 'string') {
    return notFound()
  }

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

  if (!order) return notFound()

  if (order.userId !== user?.id) {
    return redirect(
      `/sign-in?origin=thank-you?orderId=${order.id}`
    )
  }

  const products = order.items.map((item) => ({
    ...mapProductRecord(item.product),
    price: item.price,
  }))

  const orderTotal = order.items.reduce(
    (total, item) => total + item.price,
    0
  )

  return (
    <main className='relative lg:min-h-full'>
      <div className='hidden lg:block h-80 overflow-hidden lg:absolute lg:h-full lg:w-1/2 lg:pr-4 xl:pr-12'>
        <Image
          fill
          src='/checkout-thank-you.jpg'
          className='h-full w-full object-cover object-center'
          alt='thank you for your order'
        />
      </div>

      <div>
        <div className='mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-32 xl:gap-x-24'>
          <div className='lg:col-start-2'>
            <p className='text-sm font-medium text-blue-600'>
              Order successful
            </p>
            <h1 className='mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl'>
              Thanks for ordering
            </h1>
            {order.isPaid ? (
              <p className='mt-2 text-base text-muted-foreground'>
                Your order was processed and your assets are
                available to download below. We&apos;ve sent
                your receipt and order details to{' '}
                <span className='font-medium text-gray-900'>
                  {order.user.email}
                </span>
                .
              </p>
            ) : (
              <p className='mt-2 text-base text-muted-foreground'>
                We appreciate your order, and we&apos;re
                currently processing it. So hang tight and
                we&apos;ll send you confirmation very soon!
              </p>
            )}

            <div className='mt-16 text-sm font-medium'>
              <div className='text-muted-foreground'>
                Order nr.
              </div>
              <div className='mt-2 text-gray-900'>
                {order.id}
              </div>

              <ul className='mt-6 divide-y divide-gray-200 border-t border-gray-200 text-sm font-medium text-muted-foreground'>
                {products.map((product) => {
                  const label = PRODUCT_CATEGORIES.find(
                    ({ value }) =>
                      value === product.category
                  )?.label

                  const downloadUrl = `/api/download/${product.id}`
                  const imageUrl = product.images[0]?.url

                  return (
                    <li
                      key={product.id}
                      className='flex space-x-6 py-6'>
                      <div className='relative h-24 w-24'>
                        {imageUrl ? (
                          <Image
                            fill
                            src={imageUrl}
                            alt={`${product.name} image`}
                            className='flex-none rounded-md bg-gray-100 object-cover object-center'
                          />
                        ) : null}
                      </div>

                      <div className='flex-auto flex flex-col justify-between'>
                        <div className='space-y-1'>
                          <h3 className='text-gray-900'>
                            {product.name}
                          </h3>

                          <p className='my-1'>
                            Category: {label}
                          </p>
                        </div>

                        {order.isPaid ? (
                          <a
                            href={downloadUrl}
                            download={product.name}
                            className='text-blue-600 hover:underline underline-offset-2'>
                            Download asset
                          </a>
                        ) : null}
                      </div>

                      <p className='flex-none font-medium text-gray-900'>
                        {formatPrice(product.price)}
                      </p>
                    </li>
                  )
                }
                )}
              </ul>

              <div className='space-y-6 border-t border-gray-200 pt-6 text-sm font-medium text-muted-foreground'>
                <div className='flex justify-between'>
                  <p>Subtotal</p>
                  <p className='text-gray-900'>
                    {formatPrice(orderTotal)}
                  </p>
                </div>

                <div className='flex justify-between'>
                  <p>Transaction Fee</p>
                  <p className='text-gray-900'>
                    {formatPrice(1)}
                  </p>
                </div>

                <div className='flex items-center justify-between border-t border-gray-200 pt-6 text-gray-900'>
                  <p className='text-base'>Total</p>
                  <p className='text-base'>
                    {formatPrice(orderTotal + 1)}
                  </p>
                </div>
              </div>

              <PaymentStatus
                isPaid={order.isPaid}
                orderEmail={order.user.email}
                orderId={order.id}
              />

              <div className='mt-16 border-t border-gray-200 py-6 text-right'>
                <Link
                  href='/products'
                  className='text-sm font-medium text-blue-600 hover:text-blue-500'>
                  Continue shopping &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ThankYouPage
