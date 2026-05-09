'use client';

import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';

export default function AttachmentPreviewModal({
  isOpen,
  onClose,
  attachmentUrl,
  fileName = 'Anexo',
}: {
  isOpen: boolean;
  onClose: () => void;
  attachmentUrl: string | null;
  fileName?: string;
}) {
  if (!isOpen || !attachmentUrl || typeof document === 'undefined') return null;

  const lowerName = fileName.toLowerCase();
  const isPdf = lowerName.endsWith('.pdf') || attachmentUrl.toLowerCase().includes('.pdf');

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
          <h3 className="text-lg font-semibold text-white truncate max-w-[70%]">
            Visualização de Anexo
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={attachmentUrl}
              download={fileName}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar
            </a>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 bg-zinc-950/80 p-4 flex items-center justify-center overflow-auto relative">
          {isPdf ? (
            <iframe
              src={attachmentUrl}
              className="w-full h-full rounded-lg border-none bg-white"
              title="PDF Preview"
            />
          ) : (
            <img
              src={attachmentUrl}
              alt="Anexo Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
