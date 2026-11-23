import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium tracking-[0.08em] uppercase transition-all duration-300 ease-luxe focus:outline-none focus-visible:ring-1 focus-visible:ring-ink disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-[0.62rem] px-3.5 py-1.5 gap-1.5',
    md: 'text-[0.7rem] px-5 py-2.5 gap-2',
    lg: 'text-[0.78rem] px-7 py-3.5 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-ink text-bg hover:bg-ink/85 border border-ink',
    secondary: 'bg-surface text-ink hover:bg-surface/80 border border-line',
    outline: 'bg-transparent text-ink border border-line hover:border-ink hover:bg-ink/5',
    ghost: 'bg-transparent text-ink hover:bg-ink/5 border border-transparent',
    danger: 'bg-red-800 text-white hover:bg-red-900 border border-red-800',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
