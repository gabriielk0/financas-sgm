import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  console.error("ERRO CRÍTICO: DATABASE_URL não está definida nas variáveis de ambiente!");
  throw new Error("DATABASE_URL is not defined in the environment variables.");
}

let dbUrl = process.env.DATABASE_URL;

// Serverless Connection Pooling and SSL Enforcement for Neon/Postgres
if (dbUrl.startsWith('postgres') || dbUrl.startsWith('postgresql')) {
  try {
    const urlObj = new URL(dbUrl);
    // Neon requires SSL
    if (!urlObj.searchParams.has('sslmode')) {
      urlObj.searchParams.set('sslmode', 'require');
    }
    // Vercel Serverless environment benefits from PgBouncer (Pooling)
    if (!urlObj.searchParams.has('pgbouncer')) {
      urlObj.searchParams.set('pgbouncer', 'true');
    }
    dbUrl = urlObj.toString();
  } catch (err) {
    console.error("ERRO CRÍTICO: Falha ao tentar fazer o parse da DATABASE_URL:", err);
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['error', 'info', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
