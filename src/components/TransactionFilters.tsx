'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

const AREAS = [
  'Gráfica',
  'Alimentação',
  'Lanche',
  'Mini mercado',
  'Estacionamento',
  'Círculo',
  'Sala',
  'Faxina',
  'Liturgia e vigília',
  'Visitação',
  'Vigília paroquial',
  'Animação',
  'Canto',
  'Prover',
  'Equipe dirigente',
  'Comando',
  'Outros'
];

export default function TransactionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams],
  );

  const handleFilterChange = (name: string, value: string) => {
    router.push(`?${createQueryString(name, value)}`, { scroll: false });
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('area');
    params.delete('status');
    params.delete('typeFilter'); // Keep typeFilter name to match existing DashboardStats behavior or unify
    params.delete('minAmount');
    params.delete('maxAmount');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const currentSearch = searchParams.get('search') || '';
  const currentArea = searchParams.get('area') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentType = searchParams.get('typeFilter') || '';
  const currentMinAmount = searchParams.get('minAmount') || '';
  const currentMaxAmount = searchParams.get('maxAmount') || '';

  const hasActiveFilters = currentSearch || currentArea || currentStatus || currentType || currentMinAmount || currentMaxAmount;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 mb-6 shadow-lg">
      <div className="flex items-center gap-3 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por descrição, observação, nome ou finalidade..."
            value={currentSearch}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
          />
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            isOpen || hasActiveFilters
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
              : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="p-2 text-zinc-400 hover:text-rose-400 transition-colors"
            title="Limpar Filtros"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 pt-4 border-t border-zinc-800/50">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Tipo</label>
            <select
              value={currentType}
              onChange={(e) => handleFilterChange('typeFilter', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            >
              <option value="">Todos</option>
              <option value="IN">Entrada</option>
              <option value="OUT">Saída</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Status</label>
            <select
              value={currentStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            >
              <option value="">Todos</option>
              <option value="COMPLETED">Concluído</option>
              <option value="PENDING">Pendente</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Área/Equipe</label>
            <select
              value={currentArea}
              onChange={(e) => handleFilterChange('area', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            >
              <option value="">Todas</option>
              {AREAS.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Valor Mín (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={currentMinAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Valor Máx (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={currentMaxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              placeholder="0.00"
            />
          </div>
        </div>
      )}
    </div>
  );
}
