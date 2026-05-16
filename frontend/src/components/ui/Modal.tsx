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
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 md:p-6">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-500" 
        onClick={onClose} 
      />
      <div className={cn(
        "relative w-full max-w-2xl my-4 sm:my-auto transform overflow-hidden rounded-2xl sm:rounded-[32px] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-2xl transition-all duration-300 animate-in zoom-in-95 fade-in",
        className
      )}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 px-5 sm:px-8 py-4 sm:py-6 bg-white dark:bg-zinc-900">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-white transition-all active:scale-90 flex-shrink-0 ml-4"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        <div className="max-h-[70vh] sm:max-h-[80vh] overflow-y-auto p-5 sm:p-8 scrollbar-custom">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
