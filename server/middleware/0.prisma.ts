import process from 'node:process'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare module 'h3' {
  interface H3EventContext {
    prisma: PrismaClient
  }
}

export default eventHandler((event) => {
  if (!prisma) {
    const adapter = new PrismaPg({
      connectionString: `${process.env.DATABASE_URL}`
    })

    prisma = new PrismaClient({
      adapter
    })
  }

  event.context.prisma = prisma
})
