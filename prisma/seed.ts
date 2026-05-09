import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getRandomDateInMonth(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
  const randomHour = Math.floor(Math.random() * 24);
  const randomMinute = Math.floor(Math.random() * 60);
  return new Date(year, month - 1, randomDay, randomHour, randomMinute);
}

const IN_DESC = ['Doações', 'Venda de Lanches', 'Inscrições', 'Patrocínio', 'Oferta Especial'];
const OUT_DESC = ['Aluguel de Som', 'Materiais Gráficos', 'Alimentação', 'Manutenção', 'Transporte Logística', 'Decoração'];

async function main() {
  console.log('Start seeding...');

  await prisma.transaction.deleteMany();
  await prisma.monthBalance.deleteMany();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = currentDate.getMonth() + 1; // 1-12

  // Gerar os últimos 12 meses em ordem cronológica
  const monthsToGenerate = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonthNum - 1 - i, 1);
    monthsToGenerate.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      isCurrent: i === 0,
    });
  }

  let runningBalance = 5000.0; // Saldo inicial

  for (const m of monthsToGenerate) {
    const isClosed = !m.isCurrent;
    
    // Gerar de 10 a 15 transações
    const numTransactions = Math.floor(Math.random() * 6) + 10;
    const transactions = [];
    let totalIn = 0;
    let totalOut = 0;

    for (let j = 0; j < numTransactions; j++) {
      const isTypeIn = Math.random() > 0.4; // 60% de chance de ser IN
      const amount = isTypeIn 
        ? Math.floor(Math.random() * 1000) + 100 // R$ 100 a R$ 1100
        : Math.floor(Math.random() * 600) + 50;  // R$ 50 a R$ 650

      const descList = isTypeIn ? IN_DESC : OUT_DESC;
      const description = descList[Math.floor(Math.random() * descList.length)];
      
      if (isTypeIn) totalIn += amount;
      else totalOut += amount;

      transactions.push({
        date: getRandomDateInMonth(m.year, m.month),
        description,
        type: isTypeIn ? 'IN' : 'OUT',
        amount,
        status: Math.random() > 0.1 ? 'COMPLETED' : 'PENDING',
      });
    }

    // Ordenar transações por data
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    const finalBalance = runningBalance + totalIn - totalOut;

    const createdMonth = await prisma.monthBalance.create({
      data: {
        month: m.month,
        year: m.year,
        initialBalance: runningBalance,
        finalBalance: isClosed ? finalBalance : finalBalance, // No mês atual atualiza dinamicamente, mas já definimos aqui
        isClosed: isClosed,
      },
    });

    for (const t of transactions) {
      await prisma.transaction.create({
        data: {
          ...t,
          monthId: createdMonth.id,
        },
      });
    }

    if (isClosed) {
      runningBalance = finalBalance; // Levar saldo para o próximo mês
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
