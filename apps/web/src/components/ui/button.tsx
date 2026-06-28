'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import React from 'react';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-sans font-medium text-sm',
    'rounded-lg border transition-all duration-150',
    'disabled:pointer-events-none disabled:opacity-40',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[#00F2FE] text-[#0B132B] border-[#00F2FE]',
          'hover:bg-[#33F6FF] hover:border-[#33F6FF]',
          'active:bg-[#00D4E0]',
          '.light:bg-[#0066CC] .light:text-white .light:border-[#0066CC]',
        ],
        ghost: [
          'bg-transparent text-[var(--foreground)] border-[var(--border)]',
          'hover:bg-[var(--accent)] hover:border-[var(--border)]',
        ],
        outline: [
          'bg-transparent text-[var(--primary)] border-[var(--border)]',
          'hover:bg-[var(--accent)] hover:border-[var(--primary)]',
        ],
        secondary: [
          'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-transparent',
          'hover:bg-[var(--muted)] hover:border-[var(--border)]',
        ],
        danger: [
          'bg-[#FF4B2B] text-white border-[#FF4B2B]',
          'hover:bg-[#e03820] hover:border-[#e03820]',
          'active:bg-[#c42e18]',
        ],
        'danger-ghost': [
          'bg-transparent text-[#FF4B2B] border-[rgba(255,75,43,0.35)]',
          'hover:bg-[rgba(255,75,43,0.08)] hover:border-[#FF4B2B]',
        ],
        amber: [
          'bg-transparent text-[#FFB000] border-[rgba(255,176,0,0.35)]',
          'hover:bg-[rgba(255,176,0,0.08)] hover:border-[#FFB000]',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-sm',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, icon, iconPosition = 'left', disabled, children, ...props },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const iconEl = loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {iconEl && iconPosition === 'left' && iconEl}
        {children}
        {iconEl && iconPosition === 'right' && iconEl}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
