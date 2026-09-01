import React from 'react';
import { AlertTriangle, LogOut, ShieldAlert } from 'lucide-react';

interface ImpersonationBannerProps {
  tenantName: string;
  tenantId: string;
  onExit: () => void;
}

export function ImpersonationBanner({ tenantName, tenantId, onExit }: ImpersonationBannerProps) {
  return (
    <div className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2 text-xs font-poppins shadow-md flex items-center justify-between z-50 sticky top-0 animate-slideDown">
      <div className="flex items-center gap-2 font-medium overflow-hidden">
        <div className="p-1 rounded-md bg-white/20">
          <ShieldAlert className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold tracking-wide uppercase text-[10px] bg-white/25 px-2 py-0.5 rounded-full">
          Super Admin Impersonation
        </span>
        <span className="truncate">
          Operating workspace for <strong className="underline underline-offset-2">{tenantName}</strong> ({tenantId})
        </span>
      </div>

      <button
        onClick={onExit}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 transition-all shadow-sm active:scale-95 shrink-0 ml-3"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Return to Super Admin</span>
      </button>
    </div>
  );
}
