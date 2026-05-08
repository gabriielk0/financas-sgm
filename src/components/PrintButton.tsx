'use client';

import { Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrintButton() {
  const router = useRouter();

  return (
    <div className="mb-8 print:hidden flex gap-4">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded shadow transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>
      <button 
        onClick={() => window.print()}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition-colors font-medium"
      >
        <Printer className="w-4 h-4" />
        Imprimir / Salvar PDF
      </button>
    </div>
  );
}
