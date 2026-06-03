
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const res = await prisma.pagamentoOrcamento.findFirst();
    console.log('Success:', res);
  } catch (e: unknown) {
    console.error('Error:', e instanceof Error ? e.message : 'Unknown error');
  } finally {
    await prisma.$disconnect();
  }
}
main();

