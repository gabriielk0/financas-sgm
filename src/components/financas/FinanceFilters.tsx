'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

const AREAS = [
  'Gráfica', 'Alimentação', 'Lanche', 'Mini mercado', 'Estacionamento',
  'Círculo', 'Sala', 'Faxina', 'Liturgia e vigília', 'Visitação',
  'Vigília paroquial', 'Animação', 'Canto', 'Prover', 'Equipe dirigente',
  'Comando', 'Outros'
];

type FinanceFiltersProps = {
  showSearch?: boolean;
  showTeam?: boolean;
  showStatus?: boolean;
  showType?: boolean;
  showDateRange?: boolean;
};

export default function FinanceFilters({
  showSearch = true,
  showTeam = true,
  showStatus = true,
  showType = true,
  showDateRange = true,
}: FinanceFiltersProps) {
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
    params.delete('equipe');
    params.delete('status');
    params.delete('type');
    params.delete('startDate');
    params.delete('endDate');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const currentSearch = searchParams.get('search') || '';
  const currentTeam = searchParams.get('equipe') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentType = searchParams.get('type') || '';
  const currentStartDate = searchParams.get('startDate') || '';
  const currentEndDate = searchParams.get('endDate') || '';

  const hasActiveFilters = currentSearch || currentTeam || currentStatus || currentType || currentStartDate || currentEndDate;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 mb-6 shadow-lg">
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        {showSearch && (
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={currentSearch}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
          </div>
        )}
        
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              isOpen || hasActiveFilters
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros Avançados
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="p-2 text-zinc-400 border border-zinc-800 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-colors shrink-0"
              title="Limpar Filtros"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4 pt-4 border-t border-zinc-800/50">
          {showType && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Tipo</label>
              <select
                value={currentType}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              >
                <option value="">Todos</option>
                <option value="IN">Entrada</option>
                <option value="OUT">Saída</option>
              </select>
            </div>
          )}
          
          {showStatus && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Status</label>
              <select
                value={currentStatus}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              >
                <option value="">Todos</option>
                <option value="COMPLETED">Concluído / Pago</option>
                <option value="PENDING">Pendente</option>
              </select>
            </div>
          )}

          {showTeam && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Equipe/Área</label>
              <select
                value={currentTeam}
                onChange={(e) => handleFilterChange('equipe', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              >
                <option value="">Todas</option>
                {AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          )}

          {showDateRange && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={currentStartDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Data Final</label>
                <input
                  type="date"
                  value={currentEndDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm [color-scheme:dark]"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
