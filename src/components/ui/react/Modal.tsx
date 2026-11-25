import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-3xl',
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-[#070906]/80 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            {/* Modal Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={`relative w-full ${maxWidthClasses[maxWidth]} bg-bg border border-line shadow-[0_24px_80px_rgba(0,0,0,0.5)] p-6 sm:p-8 z-10 my-auto`}
              role="dialog"
              aria-modal="true"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-muted hover:text-ink transition-colors p-1 cursor-pointer"
                aria-label="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              {(title || subtitle) && (
                <div className="mb-6 pr-8">
                  {title && (
                    <h3 className="font-display text-2xl sm:text-3xl text-ink font-normal leading-tight">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="mt-1 text-xs text-muted tracking-wide leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                  <div className="mt-4 border-b border-line" />
                </div>
              )}

              {/* Content Body */}
              <div className="max-h-[70vh] overflow-y-auto pr-1">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="mt-6 pt-4 border-t border-line flex items-center justify-end gap-3">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
