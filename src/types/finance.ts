import type { Prisma } from '@prisma/client';

export type TransactionWithAttachments = Prisma.TransactionGetPayload<{
  include: { attachments: true };
}>;
