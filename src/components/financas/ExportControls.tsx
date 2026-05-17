'use client';

import { FileText, Printer } from 'lucide-react';
import { useState } from 'react';

type ExportControlsProps = {
  dataToExport?: Record<string, unknown>[];
  exportFileName?: string;
};

export default function ExportControls({ dataToExport, exportFileName = 'relatorio' }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = () => {
    if (!dataToExport || dataToExport.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }

    setIsExporting(true);
    
    try {
      // Extrair headers a partir do primeiro objeto (garantindo que não seja null ou arrays complexos se possivel)
      const headers = Object.keys(dataToExport[0]).filter(k => typeof dataToExport[0][k] !== 'object');
      
      const csvRows = [];
      // Cabeçalho
      csvRows.push(headers.join(','));

      // Linhas
      for (const row of dataToExport) {
        const values = headers.map(header => {
          const val = row[header];
          // Escape quotes
          const escaped = ('' + val).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${exportFileName}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Erro ao exportar CSV:', e);
      alert('Erro ao gerar arquivo CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleExportCSV}
        disabled={isExporting || !dataToExport}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
      >
        <FileText className="w-4 h-4" />
        Exportar CSV
      </button>

      <button
        onClick={handlePrintPDF}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white text-sm font-medium transition-colors shadow-sm"
      >
        <Printer className="w-4 h-4" />
        Imprimir / PDF
      </button>
    </div>
  );
}
