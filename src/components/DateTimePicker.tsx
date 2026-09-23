import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export type Meridiem = 'AM' | 'PM';

export interface DateTimeParts {
  date: string;
  hour: string;
  minute: string;
  ampm: Meridiem;
}

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as const;
const MINUTE_STEPS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'] as const;
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function localDateString(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map((n) => parseInt(n, 10));
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

function normHour(hour: string): string {
  const n = parseInt(hour, 10);
  if (!n || n < 1 || n > 12) return '12';
  return pad2(n);
}

function normMinute(minute: string): string {
  const n = parseInt(minute, 10);
  if (Number.isNaN(n) || n < 0 || n > 59) return '00';
  return pad2(n);
}

export function to24Hour(hour: string, ampm: Meridiem): number {
  let h = parseInt(hour, 10);
  if (Number.isNaN(h)) h = 0;
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h;
}

export function combineDateTime(parts: DateTimeParts): string {
  const minute = pad2(parseInt(parts.minute, 10) || 0);
  return `${parts.date}T${pad2(to24Hour(parts.hour, parts.ampm))}:${minute}:00`;
}

export function dateTimeFromDate(input: Date, snapStep = 0): DateTimeParts {
  const d = new Date(input.getTime());
  if (snapStep > 0) {
    const snapped = Math.round(d.getMinutes() / snapStep) * snapStep;
    d.setSeconds(0, 0);
    d.setMinutes(snapped);
  }
  let h = d.getHours();
  const ampm: Meridiem = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return {
    date: localDateString(d),
    hour: pad2(h),
    minute: pad2(d.getMinutes()),
    ampm,
  };
}

export function dateTimeFromValue(value?: string | null, fallback?: Date): DateTimeParts {
  if (!value) return dateTimeFromDate(fallback || new Date());
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { ...dateTimeFromDate(fallback || new Date()), date: value };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return dateTimeFromDate(fallback || new Date());
  return dateTimeFromDate(parsed);
}

export function formatDateTimeLabel(parts: DateTimeParts): string {
  const parsed = new Date(combineDateTime(parts));
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function time24FromParts(parts: Pick<DateTimeParts, 'hour' | 'minute' | 'ampm'>): string {
  return `${pad2(to24Hour(parts.hour, parts.ampm))}:${pad2(parseInt(parts.minute, 10) || 0)}`;
}

export function partsFromTime24(value: string, date = localDateString()): DateTimeParts {
  const [hs, ms] = (value || '09:00').split(':');
  const d = new Date();
  d.setHours(parseInt(hs || '9', 10) || 0, parseInt(ms || '0', 10) || 0, 0, 0);
  return { ...dateTimeFromDate(d), date };
}

function isPastSlot(parts: DateTimeParts): boolean {
  const parsed = new Date(combineDateTime(parts));
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now() - 30_000;
}

function nextOpenMinute(parts: DateTimeParts, minute: string, steps: string[]): string {
  if (!isPastSlot({ ...parts, minute })) return minute;
  return steps.find((step) => !isPastSlot({ ...parts, minute: step })) || minute;
}

interface DateTimePickerProps {
  date: string;
  hour: string;
  minute: string;
  ampm: Meridiem;
  onChange: (next: DateTimeParts) => void;
  minDate?: string;
  mode?: 'datetime' | 'date' | 'time';
  disablePast?: boolean;
  showQuickPicks?: boolean;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  date,
  hour,
  minute,
  ampm,
  onChange,
  minDate,
  mode = 'datetime',
  disablePast,
  showQuickPicks,
}) => {
  const selectedDate = date || localDateString();
  const selectedHour = normHour(hour);
  const selectedMinute = normMinute(minute);
  const selectedAmPm: Meridiem = ampm === 'PM' ? 'PM' : 'AM';
  const blockPast = disablePast ?? mode !== 'time';
  const showQuick = showQuickPicks ?? mode === 'datetime';
  const earliest = minDate ?? (blockPast ? localDateString() : undefined);

  const parts: DateTimeParts = {
    date: selectedDate,
    hour: selectedHour,
    minute: selectedMinute,
    ampm: selectedAmPm,
  };

  const [cursor, setCursor] = useState(() => parseLocalDate(selectedDate));

  useEffect(() => {
    if (date) setCursor(parseLocalDate(date));
  }, [date]);

  const commit = (patch: Partial<DateTimeParts>) => {
    onChange({ ...parts, ...patch });
  };

  const minuteOptions = [...MINUTE_STEPS];
  const exactMinute = minuteOptions.includes(selectedMinute) ? null : selectedMinute;

  const applyQuick = (kind: 'soon' | 'tomorrow' | 'two' | 'week') => {
    const next = new Date();
    if (kind === 'soon') {
      next.setHours(next.getHours() + 1);
      onChange(dateTimeFromDate(next, 5));
      return;
    }
    const days = kind === 'tomorrow' ? 1 : kind === 'two' ? 2 : 7;
    next.setDate(next.getDate() + days);
    next.setHours(10, 0, 0, 0);
    onChange(dateTimeFromDate(next));
  };

  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - mondayOffset);
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });

  const shiftMonth = (delta: number) => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  };

  const selectionPast = blockPast && isPastSlot(parts);

  const chipClass = (active: boolean, disabled = false) => {
    if (disabled && !active) {
      return 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed';
    }
    if (active) {
      return 'border-[#5034a8] bg-[#5034a8] text-white shadow-sm';
    }
    return 'border-slate-200 bg-white text-slate-700 hover:border-[#5034a8]/50 hover:bg-purple-50/70 active:bg-purple-100';
  };

  const timePanel = (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Time</p>
          <p className="text-[1.65rem] leading-none font-bold tabular-nums tracking-tight text-slate-900 mt-1">
            {selectedHour}:{selectedMinute}
          </p>
        </div>
        <div className="grid grid-cols-1 rounded-xl border border-slate-200 overflow-hidden shrink-0">
          {(['AM', 'PM'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => {
                const next = { ...parts, ampm: period };
                commit({
                  ampm: period,
                  minute: blockPast ? nextOpenMinute(next, selectedMinute, minuteOptions) : selectedMinute,
                });
              }}
              className={`min-w-[52px] h-9 px-3 text-xs font-bold cursor-pointer transition-colors ${
                selectedAmPm === period
                  ? 'bg-[#5034a8] text-white'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Hour</p>
        <div className="grid grid-cols-6 gap-1.5">
          {HOURS.map((h) => {
            const hourPast = blockPast && isPastSlot({ ...parts, hour: h, minute: '55' });
            const active = selectedHour === h;
            return (
              <button
                key={h}
                type="button"
                disabled={hourPast && !active}
                onClick={() => {
                  const next = { ...parts, hour: h };
                  commit({
                    hour: h,
                    minute: blockPast ? nextOpenMinute(next, selectedMinute, minuteOptions) : selectedMinute,
                  });
                }}
                className={`h-11 sm:h-10 rounded-lg border text-[13px] font-semibold tabular-nums cursor-pointer transition-colors ${chipClass(active, hourPast)}`}
              >
                {h}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Minute</p>
        <div className="grid grid-cols-6 gap-1.5">
          {minuteOptions.map((m) => {
            const minutePast = blockPast && isPastSlot({ ...parts, minute: m });
            const active = selectedMinute === m;
            return (
              <button
                key={m}
                type="button"
                disabled={minutePast && !active}
                onClick={() => commit({ minute: m })}
                className={`h-11 sm:h-10 rounded-lg border text-[13px] font-semibold tabular-nums cursor-pointer transition-colors ${chipClass(active, minutePast)}`}
              >
                {m}
              </button>
            );
          })}
        </div>
        {exactMinute && (
          <button
            type="button"
            onClick={() => commit({ minute: exactMinute })}
            className={`mt-1.5 h-10 w-full rounded-lg border text-[13px] font-semibold tabular-nums cursor-pointer ${chipClass(true)}`}
          >
            Exact {exactMinute}
          </button>
        )}
      </div>
    </div>
  );

  const calendar = (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-3.5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{monthLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((label) => (
          <div key={label} className="h-7 flex items-center justify-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = localDateString(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const selected = iso === selectedDate;
          const today = iso === localDateString();
          const disabled = Boolean(earliest && iso < earliest);
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => commit({ date: iso })}
              className={`h-10 sm:h-9 rounded-lg text-[13px] font-semibold tabular-nums cursor-pointer transition-colors ${
                selected
                  ? 'bg-[#5034a8] text-white shadow-sm'
                  : disabled
                    ? 'text-slate-300 cursor-not-allowed'
                    : today
                      ? 'bg-purple-50 text-[#5034a8] ring-1 ring-[#5034a8]/40 hover:bg-purple-100'
                      : inMonth
                        ? 'text-slate-800 hover:bg-slate-100'
                        : 'text-slate-300 hover:bg-slate-50'
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {showQuick && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([
            ['soon', 'In 1 hour'],
            ['tomorrow', 'Tomorrow 10 AM'],
            ['two', '+2 days'],
            ['week', 'Next week'],
          ] as const).map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              onClick={() => applyQuick(kind)}
              className="shrink-0 h-9 px-3 rounded-full border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:border-[#5034a8]/40 hover:bg-purple-50 hover:text-[#5034a8] cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {mode === 'time' ? (
        timePanel
      ) : mode === 'date' ? (
        calendar
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
          {calendar}
          {timePanel}
        </div>
      )}

      {mode === 'datetime' && (
        <div className={`rounded-xl px-3 py-2 text-[12px] font-semibold border ${
          selectionPast
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-purple-50 border-purple-100 text-[#5034a8]'
        }`}>
          {selectionPast ? 'This time has already passed. Choose a future time.' : formatDateTimeLabel(parts)}
        </div>
      )}
    </div>
  );
};

interface TimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export const TimeField: React.FC<TimeFieldProps> = ({ value, onChange, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const parts = partsFromTime24(value || '09:00');
  const labelDate = new Date();
  const [hs, ms] = (value || '09:00').split(':');
  labelDate.setHours(parseInt(hs || '9', 10) || 0, parseInt(ms || '0', 10) || 0, 0, 0);
  const label = labelDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="w-full flex items-center justify-between gap-2 bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900 font-semibold hover:border-[#5034a8] focus:outline-none focus:border-[#5034a8] cursor-pointer"
      >
        <span className="inline-flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {label}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close time picker"
            className="fixed inset-0 z-[70] bg-slate-900/35 sm:bg-slate-900/10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-3 bottom-3 z-[80] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-[calc(100%+8px)] sm:w-[320px] max-h-[min(70dvh,520px)] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-2xl">
            <DateTimePicker
              mode="time"
              date={parts.date}
              hour={parts.hour}
              minute={parts.minute}
              ampm={parts.ampm}
              disablePast={false}
              showQuickPicks={false}
              onChange={(next) => onChange(time24FromParts(next))}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DateTimePicker;
