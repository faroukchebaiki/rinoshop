import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { getServerSideAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SellerDashboard from './seller-dashboard'

const SellPage = async () => {
  const { user } = await getServerSideAuth()

  if (!user) {
    return redirect('/sign-in?origin=sell')
  }

  return (
    <MaxWidthWrapper className='py-16'>
      <div className='max-w-3xl'>
        <h1 className='text-3xl font-bold text-gray-900'>
          Seller dashboard
        </h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Create products, review status, and manage approvals.
        </p>
      </div>

      <SellerDashboard isAdmin={user.role === 'ADMIN'} />
    </MaxWidthWrapper>
  )
}

export default SellPage
