import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, type, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-[0.65rem] font-medium tracking-[0.1em] uppercase text-muted">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            id={inputId}
            ref={ref}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={`w-full bg-surface/50 border ${
              error ? 'border-red-600 focus:border-red-600' : 'border-line focus:border-ink'
            } text-ink placeholder:text-muted/60 px-3.5 py-2.5 ${
              isPassword ? 'pr-10' : ''
            } text-sm transition-colors duration-200 outline-none rounded-none ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="text-[0.7rem] text-red-600 tracking-wide">{error}</p>}
        {helperText && !error && <p className="text-[0.68rem] text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="text-[0.65rem] font-medium tracking-[0.1em] uppercase text-muted">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={`w-full bg-surface/50 border ${
            error ? 'border-red-600 focus:border-red-600' : 'border-line focus:border-ink'
          } text-ink placeholder:text-muted/60 px-3.5 py-2.5 text-sm transition-colors duration-200 outline-none rounded-none resize-y ${className}`}
          {...props}
        />
        {error && <p className="text-[0.7rem] text-red-600 tracking-wide">{error}</p>}
        {helperText && !error && <p className="text-[0.68rem] text-muted">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
