import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface CustomDropdownProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  wrapperClassName?: string;
  align?: 'left' | 'right';
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function CustomDropdown<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  className = '',
  menuClassName = '',
  wrapperClassName = '',
  align = 'right',
  icon,
  disabled = false,
  style,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative text-left ${wrapperClassName || 'inline-block'}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={style}
        className={`w-full flex items-center justify-between space-x-2 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-xl px-3 py-2 sm:py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer shadow-2xs ${
          isOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-slate-50' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <div className="flex items-center space-x-1.5 truncate">
          {icon && <span className="text-slate-500 shrink-0">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-1.5 min-w-full sm:min-w-[170px] max-w-xs sm:w-max bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top select-none ${menuClassName}`}
        >
          <div className="max-h-[50vh] sm:max-h-60 overflow-y-auto space-y-0.5 ios-scroll pr-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-900 font-bold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {option.icon && <span className="shrink-0 text-slate-500">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2" />}
                  {option.badge !== undefined && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono shrink-0 ml-2">
                      {option.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
