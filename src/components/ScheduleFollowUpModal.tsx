import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { Lead } from '../types';
import { toast } from '../context/ToastContext';

export interface ScheduleFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  targetStage?: string;
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
  onConfirm
}) => {
  const [schedulerDueDay, setSchedulerDueDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [schedulerHour, setSchedulerHour] = useState('10');
  const [schedulerMinute, setSchedulerMinute] = useState('00');
  const [schedulerAmPm, setSchedulerAmPm] = useState<'AM' | 'PM'>('AM');
  const [schedulerRemarks, setSchedulerRemarks] = useState('');

  useEffect(() => {
    if (isOpen && lead) {
      if (lead.followUpAt) {
        const d = new Date(lead.followUpAt);
        if (!isNaN(d.getTime())) {
          setSchedulerDueDay(lead.followUpAt.slice(0, 10));
          let h = d.getHours();
          const isPm = h >= 12;
          if (h > 12) h -= 12;
          if (h === 0) h = 12;
          setSchedulerHour(String(h).padStart(2, '0'));
          setSchedulerMinute(String(d.getMinutes()).padStart(2, '0'));
          setSchedulerAmPm(isPm ? 'PM' : 'AM');
        } else {
          initDefaultTime();
        }
      } else {
        initDefaultTime();
      }
      setSchedulerRemarks('');
    }
  }, [isOpen, lead]);

  const initDefaultTime = () => {
    const defaultDate = new Date(Date.now() + 3600000);
    setSchedulerDueDay(defaultDate.toISOString().slice(0, 10));
    let h = defaultDate.getHours();
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    setSchedulerHour(String(h).padStart(2, '0'));
    setSchedulerMinute(String(defaultDate.getMinutes()).padStart(2, '0'));
    setSchedulerAmPm(period);
  };

  if (!isOpen || !lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let h = parseInt(schedulerHour, 10);
    if (schedulerAmPm === 'PM' && h !== 12) h += 12;
    if (schedulerAmPm === 'AM' && h === 12) h = 0;
    const combinedDate = `${schedulerDueDay}T${String(h).padStart(2, '0')}:${schedulerMinute}:00`;

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
      className="fixed inset-0 bg-slate-900/60 z-[1001] flex items-center justify-center p-4 font-sans animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Schedule Follow-Up</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Follow-Up Date *</label>
            <input
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              value={schedulerDueDay}
              onChange={(e) => setSchedulerDueDay(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Follow-Up Time *</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={schedulerHour}
                onChange={(e) => setSchedulerHour(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>

              <select
                value={schedulerMinute}
                onChange={(e) => setSchedulerMinute(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={schedulerAmPm}
                onChange={(e) => setSchedulerAmPm(e.target.value as 'AM' | 'PM')}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Follow-Up Remarks / Purpose</label>
            <textarea
              rows={2}
              value={schedulerRemarks}
              onChange={(e) => setSchedulerRemarks(e.target.value)}
              placeholder="e.g. Call client regarding quote discussion and demo"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md shadow-indigo-100"
            >
              Set Follow-Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ScheduleFollowUpModal;
