'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ReceiptText, FileText, ChevronDown } from 'lucide-react';

export default function NovaSolicitacaoMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        <Plus className="h-4 w-4" />
        Nova Solicitação
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="p-1">
            <Link
              href="/pagamentos/reembolso/solicitar"
              onClick={() => setIsOpen(false)}
              className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <ReceiptText className="h-4 w-4 text-zinc-400 group-hover:text-indigo-400" />
              Reembolso de Despesa
            </Link>
            <Link
              href="/pagamentos/orcamentos/solicitar"
              onClick={() => setIsOpen(false)}
              className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <FileText className="h-4 w-4 text-zinc-400 group-hover:text-indigo-400" />
              Pagamento de Orçamento
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
