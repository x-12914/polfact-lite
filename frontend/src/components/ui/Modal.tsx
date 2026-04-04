import { X } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-500" 
        onClick={onClose} 
      />
      <div className={cn(
        "relative w-full max-w-2xl transform overflow-hidden rounded-[32px] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-2xl transition-all duration-300 animate-in zoom-in-95 fade-in",
        className
      )}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 px-8 py-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-white transition-all active:scale-90"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-8 scrollbar-custom">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
