import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.js'

// Cria uma única instância do PrismaClient para toda a aplicação
// Isso evita criar múltiplas conexões com o banco de dados

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Loga queries apenas em desenvolvimento
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// Em desenvolvimento, salva a instância no objeto global
// para evitar criar novas conexões a cada hot reload
if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
