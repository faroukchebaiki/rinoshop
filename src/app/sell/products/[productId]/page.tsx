import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { getServerSideAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import EditProductForm from './product-form'
import ProductAssets from './product-assets'

const EditProductPage = async ({
  params,
}: {
  params: Promise<{ productId: string }>
}) => {
  const { user } = await getServerSideAuth()

  if (!user) {
    return redirect('/sign-in?origin=sell')
  }

  const { productId } = await params

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      category: true,
      approvedForSale: true,
    },
  })

  if (!product) {
    return notFound()
  }

  return (
    <MaxWidthWrapper className='py-16'>
      <EditProductForm product={product} />
      <ProductAssets
        productId={product.id}
        isLocked={product.approvedForSale === 'APPROVED'}
      />
    </MaxWidthWrapper>
  )
}

export default EditProductPage
