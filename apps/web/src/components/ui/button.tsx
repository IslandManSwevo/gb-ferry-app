'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import React from 'react';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-mono text-xs tracking-widest uppercase',
    'border transition-colors duration-150',
    'disabled:pointer-events-none disabled:opacity-40',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#33FF33]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[#33FF33] text-[#050505] border-[#33FF33]',
          'hover:bg-[#1adf1a] hover:border-[#1adf1a]',
          'active:bg-[#0fbe0f]',
        ],
        ghost: [
          'bg-transparent text-[#33FF33] border-[rgba(51,255,51,0.3)]',
          'hover:bg-[rgba(51,255,51,0.08)] hover:border-[#33FF33]',
        ],
        outline: [
          'bg-transparent text-[#eaeaea] border-[rgba(255,255,255,0.2)]',
          'hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.4)]',
        ],
        danger: [
          'bg-[#FF4B2B] text-[#eaeaea] border-[#FF4B2B]',
          'hover:bg-[#e03820] hover:border-[#e03820]',
          'active:bg-[#c42e18]',
        ],
        'danger-ghost': [
          'bg-transparent text-[#FF4B2B] border-[rgba(255,75,43,0.4)]',
          'hover:bg-[rgba(255,75,43,0.1)] hover:border-[#FF4B2B]',
        ],
        amber: [
          'bg-transparent text-[#FFB000] border-[rgba(255,176,0,0.4)]',
          'hover:bg-[rgba(255,176,0,0.1)] hover:border-[#FFB000]',
        ],
      },
      size: {
        sm: 'h-7 px-3 text-[10px]',
        md: 'h-9 px-4 text-xs',
        lg: 'h-11 px-6 text-xs',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
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
    {
      className,
      variant,
      size,
      loading,
      icon,
      iconPosition = 'left',
      disabled,
      children,
      ...props
    },
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
