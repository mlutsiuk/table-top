import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

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
