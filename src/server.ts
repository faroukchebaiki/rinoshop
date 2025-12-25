import 'dotenv/config'
import express from 'express'
import nextBuild from 'next/dist/build/index.js'
import path from 'path'
import { parse } from 'url'
import { nextApp, nextHandler } from './next-utils'
import { createExpressApp } from './server/express-app'
import { getAuthSessionFromRequest } from './lib/auth'

const PORT = Number(process.env.PORT) || 3000

// Starts the local Node server that wires Express and Next.js.
const start = async () => {
    const app = createExpressApp()

    if (process.env.NEXT_BUILD) {
        app.listen(PORT, async () => {
            console.log('Next.js is building for production')

            // @ts-expect-error
            const build = nextBuild.default || nextBuild
            await build(path.join(__dirname, '../'))

            process.exit()
        })

        return
    }

    const cartRouter = express.Router()

    // Protect the cart page using Neon Auth in the custom server.
    cartRouter.use(async (req, res, next) => {
        const { user } = await getAuthSessionFromRequest(
            req,
            res
        )

        if (!user) {
            return res.redirect('/sign-in?origin=cart')
        }

        return next()
    })

    cartRouter.get('/', (req, res) => {
        const parsedUrl = parse(req.url, true)
        const { query } = parsedUrl

        return nextApp.render(req, res, '/cart', query)
    })

    app.use('/cart', cartRouter)

    app.use((req, res) => nextHandler(req, res))

    nextApp.prepare().then(() => {
        console.log('Next.js started')

        app.listen(PORT, async () => {
            console.log(
                `Next.js App URL: ${process.env.NEXT_PUBLIC_SERVER_URL}`
            )
        })
    })
}

start()
