import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { Lead } from '../types';
import { toast } from '../context/ToastContext';
import {
  DateTimePicker,
  DateTimeParts,
  combineDateTime,
  dateTimeFromDate,
  dateTimeFromValue,
  localDateString,
} from './DateTimePicker';

export interface ScheduleFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  targetStage?: string;
  title?: string;
  confirmLabel?: string;
  showRemarks?: boolean;
  onConfirm: (data: {
    lead: Lead;
    targetStage: string;
    combinedDate: string;
    remarks: string;
  }) => void;
}

export const ScheduleFollowUpModal: React.FC<ScheduleFollowUpModalProps> = ({
  isOpen,
  onClose,
  lead,
  targetStage = 'Follow Up',
  title = 'Schedule Follow-Up',
  confirmLabel = 'Set Follow-Up',
  showRemarks = true,
  onConfirm
}) => {
  const [when, setWhen] = useState<DateTimeParts>(() => dateTimeFromDate(new Date(Date.now() + 3600000), 5));
  const [schedulerRemarks, setSchedulerRemarks] = useState('');

  useEffect(() => {
    if (isOpen && lead) {
      if (lead.followUpAt) {
        const parsed = new Date(lead.followUpAt);
        setWhen(Number.isNaN(parsed.getTime())
          ? dateTimeFromDate(new Date(Date.now() + 3600000), 5)
          : dateTimeFromValue(lead.followUpAt));
      } else {
        setWhen(dateTimeFromDate(new Date(Date.now() + 3600000), 5));
      }
      setSchedulerRemarks('');
    }
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const combinedDate = combineDateTime(when);
    const selectedDateTime = new Date(combinedDate);
    if (selectedDateTime < new Date()) {
      toast.warning('Please select a future date and time for the follow-up.', 'Invalid Schedule Time');
      return;
    }

    onConfirm({
      lead,
      targetStage,
      combinedDate,
      remarks: schedulerRemarks.trim()
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-[1001] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[94dvh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-4 sm:px-5 pt-3 pb-3">
          <div className="sm:hidden mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{title}</h3>
                <p className="text-[11px] text-slate-500 truncate">
                  {lead.name}{lead.phone ? ` · ${lead.phone}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <DateTimePicker
            date={when.date}
            hour={when.hour}
            minute={when.minute}
            ampm={when.ampm}
            minDate={localDateString()}
            onChange={setWhen}
          />

          {showRemarks && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 text-[11px] uppercase tracking-wider">
                Remarks / purpose
              </label>
              <textarea
                rows={2}
                value={schedulerRemarks}
                onChange={(e) => setSchedulerRemarks(e.target.value)}
                placeholder="e.g. Call client regarding quote discussion and demo"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-[#5034a8] resize-none"
              />
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-200 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              className="h-11 sm:h-10 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-11 sm:h-10 px-5 rounded-xl bg-[#5034a8] hover:bg-[#432993] text-white font-bold cursor-pointer shadow-md shadow-purple-100"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleFollowUpModal;
