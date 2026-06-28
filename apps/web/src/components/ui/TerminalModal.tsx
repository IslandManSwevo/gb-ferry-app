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
  /** Footer action buttons — rendered right-aligned */
  footer?: React.ReactNode;
  /** Pixel width of the modal panel (default 560) */
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75"
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
        className="relative z-10 bg-[#050505] border border-[rgba(51,255,51,0.25)] flex flex-col focus:outline-none"
        style={{ width: Math.min(width, window.innerWidth - 32), maxHeight: 'calc(100vh - 64px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(51,255,51,0.15)]">
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#33FF33]">
            {title}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-[rgba(51,255,51,0.4)] hover:text-[#33FF33] transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[rgba(51,255,51,0.1)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ── Form helpers ─────────────────────────────────────────── */

const labelCls = 'block font-mono text-[10px] tracking-[0.1em] uppercase text-[rgba(51,255,51,0.5)] mb-1';
const inputCls =
  'w-full bg-[#050505] border border-[rgba(51,255,51,0.2)] text-[rgba(51,255,51,0.8)] font-mono text-[12px] px-3 py-2 focus:outline-none focus:border-[rgba(51,255,51,0.5)] transition-colors placeholder:text-[rgba(51,255,51,0.2)]';
const errorCls = 'font-mono text-[10px] text-[#FF4B2B] mt-1';
const sectionCls = 'font-mono text-[9px] tracking-[0.15em] uppercase text-[rgba(51,255,51,0.3)] border-b border-[rgba(51,255,51,0.1)] pb-1 mb-4 mt-6 first:mt-0';

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
  options: { label: string; value: string }[];
}

export function SelectField({ label, error, options, className, ...props }: SelectFieldProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <label className={labelCls}>{label}</label>
      <select className={`${inputCls} appearance-none`} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#050505]">
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

export { labelCls as termLabelCls, inputCls as termInputCls, sectionCls as termSectionCls, Button };
