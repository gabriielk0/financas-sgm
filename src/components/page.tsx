'use client';

import PrivateRoute from '@/components/PrivateRoute';
import Link from 'next/link';

export default function MinhasSolicitacoesPage() {
  // Mocks contendo registros de reembolso
  const solicitacoes = [
    {
      id: '1',
      descricao: 'Combustível Evento',
      equipe: 'TI',
      valor: 150.0,
      data: '2024-05-10',
      status: 'PENDENTE_REEMBOLSO',
    },
    {
      id: '2',
      descricao: 'Materiais Gráfica',
      equipe: 'Gráfica',
      valor: 320.5,
      data: '2024-05-08',
      status: 'APROVADO',
    },
    {
      id: '3',
      descricao: 'Alimentação Evento Base',
      equipe: 'Coordenação',
      valor: 45.0,
      data: '2024-05-05',
      status: 'REJEITADO',
      motivo_rejeicao: 'Falta enviar a nota fiscal válida na aba de anexos.',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE_REEMBOLSO':
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-xs font-medium">
            Pendente
          </span>
        );
      case 'APROVADO':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs font-medium">
            Aprovado
          </span>
        );
      case 'REJEITADO':
        return (
          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded text-xs font-medium">
            Rejeitado
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  return (
    <PrivateRoute modulo="reembolso">
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-zinc-800 pb-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Minhas Solicitações
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Acompanhe o status dos seus reembolsos solicitados.
              </p>
            </div>

            <Link
              href="/reembolso/solicitar"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-lg text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nova Solicitação
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {solicitacoes.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow flex flex-col sm:flex-row justify-between gap-4 transition-all hover:bg-zinc-800/50"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {item.descricao}
                    </h3>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-sm text-zinc-400 flex items-center gap-2">
                    <span>
                      {new Date(item.data).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                    <span>{item.equipe}</span>
                  </div>
                  {item.status === 'REJEITADO' && item.motivo_rejeicao && (
                    <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-300">
                      <strong className="block mb-1 text-rose-400 font-semibold">
                        Motivo da Rejeição:
                      </strong>
                      {item.motivo_rejeicao}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:items-end justify-center shrink-0">
                  <span className="text-xl font-bold text-white">
                    {formatCurrency(item.valor)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}
