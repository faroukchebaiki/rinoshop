import type { ExpressContext } from '@/server/express-app'
import { TRPCError, initTRPC } from '@trpc/server'

const t = initTRPC.context<ExpressContext>().create()
const middleware = t.middleware

// Ensures a user is present on the request before running protected routes.
const isAuth = middleware(async ({ ctx, next }) => {
  const user = ctx.auth.user

  if (!user || !user.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  })
})

export const router = t.router
export const publicProcedure = t.procedure
export const privateProcedure = t.procedure.use(isAuth)
