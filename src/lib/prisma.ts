import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  console.error("ERRO CRÍTICO: DATABASE_URL não está definida nas variáveis de ambiente!");
}

// Em ambientes Serverless (como Vercel), instanciar o Prisma múltiplas vezes
// devido a hot-reloads (dev) ou warm-ups de função pode esgotar as conexões.
// Usamos o padrão global para cachear a instância APENAS em desenvolvimento.
// Em produção na Vercel (Edge/Serverless), uma nova instância será criada 
// por lambda, mas o Neon Connection Pooling cuida disso através do DATABASE_URL.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
