'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';

export interface TerminalModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export function TerminalModal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
}: TerminalModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      panelRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="presentation">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal
        aria-label={title}
        className="relative z-10 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-card flex flex-col focus:outline-none"
        style={{ width: Math.min(width, window.innerWidth - 32), maxHeight: 'calc(100vh - 64px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <span className="font-display text-[15px] font-semibold text-[var(--foreground)]">
            {title}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ── Form helpers ─────────────────────────────────────────── */

const labelCls = 'block text-[11px] font-medium text-[var(--muted-foreground)] mb-1.5 tracking-wide uppercase font-mono';
const inputCls =
  'w-full bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-all placeholder:text-[var(--muted-foreground)]';
const errorCls = 'text-[11px] text-[#FF4B2B] mt-1';
const sectionCls = 'text-[10px] tracking-[0.12em] uppercase text-[var(--muted-foreground)] border-b border-[var(--border)] pb-1.5 mb-4 mt-6 first:mt-0 font-mono';

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Field({ label, error, className, ...props }: FieldProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <label className={labelCls}>{label}</label>
      <input className={inputCls} {...props} />
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options?: { label: string; value: string }[];
}

export function SelectField({ label, error, options, className, children, ...props }: SelectFieldProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <label className={labelCls}>{label}</label>
      <select className={`${inputCls} appearance-none`} {...props}>
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

export { labelCls as termLabelCls, inputCls as termInputCls, sectionCls as termSectionCls, Button };
