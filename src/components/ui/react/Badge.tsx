import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'available' | 'unavailable' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'member' | 'default';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[0.58rem] px-2 py-0.5',
    md: 'text-[0.62rem] px-2.5 py-1',
  };

  const variantStyles = {
    available: 'bg-accent/15 text-accent border border-accent/30',
    unavailable: 'bg-muted/15 text-muted border border-muted/30 line-through decoration-muted/50',
    pending: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30',
    processing: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30',
    shipped: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30',
    completed: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30',
    cancelled: 'bg-red-500/15 text-red-800 dark:text-red-300 border border-red-500/30',
    member: 'bg-accent-fill/25 text-ink border border-accent font-semibold',
    default: 'bg-surface text-muted border border-line',
  };

  return (
    <span
      className={`inline-flex items-center font-medium uppercase tracking-[0.08em] whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
