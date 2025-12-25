import { PrismaClient } from '@/generated/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const connectionString = `${process.env.DATABASE_URL}`

// PrismaNeon takes the config directly in recent versions
const adapter = new PrismaNeon({ connectionString })

// Reuse the Prisma client in dev to avoid exhausting connections.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
