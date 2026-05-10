// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// 使用全局单例来避免在开发环境下创建过多的数据库连接
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// 如果全局没有Prisma实例就创建一个，有就直接拿来用
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// 在非生产环境下，把prisma实例挂载到global对象上
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma