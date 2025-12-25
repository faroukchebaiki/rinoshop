
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'
import 'dotenv/config'

neonConfig.webSocketConstructor = ws

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
    try {
        console.log('Connecting...')
        await prisma.$connect()
        console.log('Connected!')
        const count = await prisma.user.count()
        console.log('User count:', count)
    } catch (e) {
        console.error('DB Error:', e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
