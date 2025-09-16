import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient
}

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// WHen Hot reloading occurs then when we update a file then multiple files can get reloaded again including this file if imported and if that happens then multiple times db connection will be estabiled and because of that connection limit will exceed . so to prevent from this in dev mode we store prisma client in global object for the first time. and later just reuse it 
// It does n't occur in production