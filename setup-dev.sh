#!/bin/bash
echo "Configurando ambiente de desenvolvimento..."

if [ ! -f .env ]; then
  echo "Criando arquivo .env a partir de .env.example..."
  cp .env.example .env
fi

echo "Executando migrações do Prisma (SQLite Local)..."
npm run db:push:local

echo "Populando banco de dados com dados fictícios..."
npm run db:seed

echo "Ambiente configurado! Você pode iniciar o servidor com: npm run dev"
