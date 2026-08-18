import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a] w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs shadow-inner ${isDestructive ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-zinc-900 border-zinc-700 text-zinc-300'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm font-serif italic">{title}</h3>
          </div>

          <button onClick={onCancel} className="p-1 text-zinc-400 hover:text-white rounded transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-zinc-300 leading-relaxed font-sans">{message}</p>

          <div className="pt-4 border-t border-[#27272a] flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 text-[10px] uppercase tracking-widest font-semibold transition"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition shadow-sm ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-white hover:bg-zinc-200 text-black'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
