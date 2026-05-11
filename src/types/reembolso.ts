import type { Prisma } from '@prisma/client';

export type ReembolsoPendente = Prisma.ReembolsoGetPayload<{
  include: { usuario: true };
}>;
