import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, X, Check, Loader2 } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

export interface SearchableSelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string, option?: SelectOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  className?: string;
  error?: string;
  helperText?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  searchPlaceholder = 'Cari opsi...',
  disabled = false,
  loading = false,
  required = false,
  className = '',
  error,
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      opt.label.toLowerCase().includes(term) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(term)) ||
      (opt.badge && opt.badge.toLowerCase().includes(term))
    );
  });

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: SelectOption) => {
    onChange(option.value, option);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
  };

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted block"
        >
          {label} {required && <span className="text-accent">*</span>}
          {loading && <span className="text-accent ml-1.5 lowercase font-normal">(memuat...)</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled || loading ? -1 : 0}
        onClick={() => {
          if (!disabled && !loading) setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !loading) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full min-h-[42px] px-3.5 py-2 bg-surface/40 border text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors select-none ${
          error
            ? 'border-red-500/60 focus:border-red-500'
            : isOpen
            ? 'border-accent ring-1 ring-accent/30'
            : 'border-line hover:border-line-hover'
        } ${disabled || loading ? 'opacity-50 cursor-not-allowed bg-surface/20' : ''}`}
      >
        <div className="flex-1 min-w-0 text-left">
          {selectedOption ? (
            <div className="flex items-center gap-2">
              <span className="text-ink font-medium truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider bg-accent-fill/30 text-ink border border-accent/40 rounded-xs">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted/70">{loading ? 'Memuat data...' : placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-muted">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
          ) : (
            <>
              {selectedOption && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-0.5 hover:text-ink cursor-pointer transition-colors"
                  title="Hapus pilihan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : ''}`}
              />
            </>
          )}
        </div>
      </div>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute z-[9999] left-0 right-0 mt-1 bg-bg border border-line shadow-2xl rounded-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Field Inside Dropdown */}
          <div className="p-2 border-b border-line bg-surface/50 relative">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-accent absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  } else if (e.key === 'Enter' && filteredOptions.length > 0) {
                    e.preventDefault();
                    handleSelect(filteredOptions[0]);
                  }
                }}
                placeholder={searchPlaceholder}
                className="w-full bg-surface/80 border border-line pl-8 pr-7 py-1.5 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 text-muted hover:text-ink cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            role="listbox"
            className="max-h-56 overflow-y-auto divide-y divide-line py-1 bg-bg"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    className={`px-3 py-2.5 text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-accent/15 text-accent font-semibold'
                        : 'text-ink hover:bg-surface/80 hover:text-ink'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider bg-accent/20 text-ink border border-accent/30 rounded-xs">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.sublabel && (
                        <p className="text-[0.68rem] text-muted truncate mt-0.5">{opt.sublabel}</p>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-accent shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="py-6 px-4 text-center text-xs text-muted">
                Tidak ada opsi yang cocok dengan "{search}"
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-[0.7rem] text-red-400 mt-1">{error}</p>}
      {helperText && !error && <p className="text-[0.7rem] text-muted mt-1">{helperText}</p>}
    </div>
  );
};
