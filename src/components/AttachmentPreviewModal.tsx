'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

type AttachmentItem = {
  id: string;
  url: string;
  filename: string;
};

export default function AttachmentPreviewModal({
  isOpen,
  onClose,
  attachments,
  initialIndex = 0,
  onDeleteAttachment,
}: {
  isOpen: boolean;
  onClose: () => void;
  attachments: AttachmentItem[];
  initialIndex?: number;
  onDeleteAttachment?: (
    attachmentId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const visibleAttachments = attachments.filter(
    (attachment) => !removedIds.includes(attachment.id),
  );
  const activeIndex = Math.min(
    Math.max(currentIndex, 0),
    Math.max(visibleAttachments.length - 1, 0),
  );

  if (
    !isOpen ||
    visibleAttachments.length === 0 ||
    typeof document === 'undefined'
  )
    return null;

  const current = visibleAttachments[activeIndex];
  const lowerName = current.filename.toLowerCase();
  const isPdf =
    lowerName.endsWith('.pdf') || current.url.toLowerCase().includes('.pdf');

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
          <h3 className="text-lg font-semibold text-white truncate max-w-[60%]">
            {current.filename}
          </h3>
          <div className="flex items-center gap-2">
            {visibleAttachments.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      prev === 0 ? visibleAttachments.length - 1 : prev - 1,
                    )
                  }
                  className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Anexo anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-zinc-400 min-w-14 text-center">
                  {activeIndex + 1}/{visibleAttachments.length}
                </span>
                <button
                  onClick={() =>
                    setCurrentIndex(
                      (prev) => (prev + 1) % visibleAttachments.length,
                    )
                  }
                  className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Próximo anexo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            <a
              href={current.url}
              download={current.filename}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar
            </a>
            {!!onDeleteAttachment && (
              <button
                onClick={async () => {
                  const shouldDelete = window.confirm(
                    `Excluir o anexo "${current.filename}"?`,
                  );
                  if (!shouldDelete) return;
                  setIsDeleting(true);
                  setDeleteError(null);
                  const result = await onDeleteAttachment(current.id);
                  setIsDeleting(false);
                  if (!result.success) {
                    setDeleteError(result.error || 'Falha ao excluir anexo.');
                    return;
                  }

                  const nextLength = visibleAttachments.length - 1;
                  setRemovedIds((prev) => [...prev, current.id]);
                  if (nextLength <= 0) {
                    onClose();
                    return;
                  }
                  setCurrentIndex((prev) =>
                    Math.min(prev, Math.max(nextLength - 1, 0)),
                  );
                }}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                title="Excluir anexo"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            )}
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
          {deleteError && (
            <div className="absolute top-4 left-4 right-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {deleteError}
            </div>
          )}
          {isPdf ? (
            <iframe
              src={current.url}
              className="w-full h-full rounded-lg border-none bg-white"
              title="PDF Preview"
            />
          ) : (
            <img
              src={current.url}
              alt="Anexo Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
