import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import ProductReel from '@/components/ProductReel'
import {
  Button,
  buttonVariants,
} from '@/components/ui/button'
import {
  ArrowDownToLine,
  CheckCircle,
  Leaf,
} from 'lucide-react'
import Link from 'next/link'

const perks = [
  {
    name: 'Instant Delivery',
    Icon: ArrowDownToLine,
    description:
      'Get your assets delivered to your email in seconds and download them right away.',
  },
  {
    name: 'Guaranteed Quality',
    Icon: CheckCircle,
    description:
      'Every asset on our platform is verified by our team to ensure our highest quality standards. Not happy? We offer a 30-day refund guarantee.',
  },
  {
    name: 'For the Planet',
    Icon: Leaf,
    description:
      "We've pledged 1% of sales to the preservation and restoration of the natural environment.",
  },
]

export default function Home() {
  return (
    <>
      <MaxWidthWrapper>
        <div className='py-20 mx-auto text-center flex flex-col items-center max-w-3xl relative'>
          <div className="absolute -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none opacity-40">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}>
            </div>
          </div>

          <h1 className='text-4xl font-heading font-bold tracking-tight text-gray-900 sm:text-6xl animate-in fade-in slide-in-from-bottom-8 duration-700'>
            Your marketplace for high-quality{' '}
            <span className='text-primary'>
              digital assets
            </span>
            .
          </h1>
          <p className='mt-6 text-lg max-w-prose text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both'>
            Welcome to Rinoshop. Every asset on our
            platform is verified by our team to ensure our
            highest quality standards.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both'>
            <Link
              href='/products'
              className={buttonVariants({ size: 'lg', className: "shadow-lg hover:shadow-xl transition-all" })}>
              Browse Trending
            </Link>
            <Button variant='ghost' size='lg'>
              Our quality promise &rarr;
            </Button>
          </div>
        </div>

        <ProductReel
          query={{ sort: 'desc', limit: 4 }}
          href='/products?sort=recent'
          title='Brand new'
        />
      </MaxWidthWrapper>

      <section className='border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white'>
        <MaxWidthWrapper className='py-20'>
          <div className='grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0'>
            {perks.map((perk) => (
              <div
                key={perk.name}
                className='text-center md:flex md:items-start md:text-left lg:block lg:text-center group hover-lift bg-white rounded-xl p-6 border border-gray-100'
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid #f3f4f6',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                  transition: 'all 0.3s ease-in-out'
                }}>
                <div className='md:flex-shrink-0 flex justify-center'>
                  <div
                    className='h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg group-hover:shadow-xl transition-shadow'
                    style={{
                      backgroundImage: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
                    }}>
                    {<perk.Icon className='w-8 h-8' />}
                  </div>
                </div>

                <div className='mt-6 md:ml-4 md:mt-0 lg:ml-0 lg:mt-6'>
                  <h3 className='text-base font-semibold text-gray-900'>
                    {perk.name}
                  </h3>
                  <p className='mt-3 text-sm text-muted-foreground leading-relaxed'>
                    {perk.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </MaxWidthWrapper>
      </section>
    </>
  )
}
