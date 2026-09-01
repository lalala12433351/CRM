import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Lead } from '../types';
import { StatusBadge } from './StatusBadge';

interface LeadSummaryModalProps {
  lead: Lead | null;
  onClose: () => void;
  onCallLead?: (lead: Lead) => void;
  onScheduleFollowUp?: (lead: Lead) => void;
}

export const LeadSummaryModal: React.FC<LeadSummaryModalProps> = ({
  lead,
  onClose,
  onCallLead,
  onScheduleFollowUp
}) => {
  const [copiedNumber, setCopiedNumber] = useState(false);

  if (!lead) return null;

  const locationText = [lead.city, lead.state].filter(Boolean).join(', ') || 'Not Specified';

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(lead.phone);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCall = () => {
    if (onCallLead) {
      onCallLead(lead);
    } else {
      window.location.href = `tel:${lead.phone}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden font-sans text-xs animate-in fade-in zoom-in-95">
        
        {/* Header - Plain text, no icons */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between font-sans">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Lead Summary</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-sm font-sans"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 font-sans">

          {/* Lead Name & Details Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-sans">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-medium text-slate-900 font-sans tracking-tight">{lead.name}</h2>
                {lead.company && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5 font-sans">
                    {lead.company}
                  </p>
                )}
              </div>
            </div>

            {/* Phone Number Display with Copy */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-2xs font-sans">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-sans">Phone Number</span>
                <span className="text-base font-normal text-slate-900 font-sans tracking-tight">{lead.phone}</span>
              </div>

              <button
                onClick={handleCopyNumber}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors font-sans"
                title="Copy Phone Number"
              >
                {copiedNumber ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Quick Summary Grid - Plain labels without icons */}
          <div className="grid grid-cols-2 gap-3 text-xs font-sans">
            {/* Source */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1 font-sans">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans block">
                Lead Source
              </span>
              <p className="font-semibold text-slate-900 text-xs truncate font-sans">{lead.source || 'Direct Meta'}</p>
            </div>

            {/* Location (State & City) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1 font-sans">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans block">
                State City
              </span>
              <p className="font-semibold text-slate-900 text-xs truncate font-sans">{locationText}</p>
            </div>

            {/* Owner */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1 font-sans">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans block">
                Assigned Agent
              </span>
              <p className="font-semibold text-slate-900 text-xs truncate font-sans">{lead.ownerAgentName || 'Unassigned'}</p>
            </div>

            {/* Quality / Rating */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1 font-sans">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans block">
                Quality Rating
              </span>
              <p className="font-semibold text-slate-900 text-xs truncate font-sans">
                {lead.aiRating || 'Warm'} • ₹{(lead.dealValue || 0).toLocaleString()}
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions - Only 1 Call Lead button, no icons */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between font-sans">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold cursor-pointer text-xs transition-colors font-sans"
          >
            Close
          </button>

          <div className="flex items-center space-x-2 font-sans">
            {onScheduleFollowUp && (
              <button
                onClick={() => {
                  onClose();
                  onScheduleFollowUp(lead);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-normal text-xs cursor-pointer transition-colors font-sans"
              >
                Follow Up
              </button>
            )}

            <button
              onClick={handleCall}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-2xs transition-colors font-sans"
            >
              Call Lead
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
