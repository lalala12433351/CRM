import React from 'react';
import { LucideIcon, Inbox, Plus, ArrowRight, RefreshCw, Search } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionIcon?: LucideIcon;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionIcon: SecondaryActionIcon = RefreshCw,
  compact = false,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-slate-200 bg-white/60 backdrop-blur-xs select-none transition-all ${
        compact ? 'p-6 sm:p-8 my-3' : 'p-8 sm:p-14 my-6'
      } ${className}`}
    >
      {/* Centered Icon Container with Glow Accent */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl transform scale-150 pointer-events-none" />
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm relative z-10">
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.75]" />
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-1.5 font-sans">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed font-sans mb-5">
        {description}
      </p>

      {/* Action Buttons */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#5034a8] hover:bg-[#432b8e] text-white font-semibold text-xs shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
            >
              <ActionIcon className="w-4 h-4" />
              <span>{actionLabel}</span>
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-all cursor-pointer"
            >
              <SecondaryActionIcon className="w-3.5 h-3.5" />
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
