import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Moon,
  Hourglass,
  X
} from 'lucide-react';

export type ExecutionStatus = 'success' | 'failed' | 'sleeping' | 'waiting' | 'pending';
export type TimeFilterOption = 'all' | '1hour' | '24hours' | '7days' | '30days';

export interface ExecutionRecord {
  id: string;
  triggerName: string;
  leadName: string;
  leadPhone: string;
  status: ExecutionStatus;
  duration: string;
  timestamp: string;
  createdAt?: string;
  logs?: { step: number; title: string; status: 'success' | 'failed'; message: string }[];
}

interface WorkflowExecutionsTableProps {
  executions?: ExecutionRecord[];
}

const statusOptions: { value: 'all' | ExecutionStatus; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'sleeping', label: 'Sleeping' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'pending', label: 'Pending' }
];

const timeOptions: { value: TimeFilterOption; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: '1hour', label: 'Last Hour' },
  { value: '24hours', label: 'Last 24 Hours' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' }
];

interface CustomDropdownProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (val: T) => void;
  icon: React.ReactNode;
}

function CustomDropdown<T extends string>({
  value,
  options,
  onChange,
  icon
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 text-xs font-normal text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#3a2088] cursor-pointer shadow-2xs transition-colors"
      >
        {icon}
        <span>{selectedOption.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-xl shadow-xl p-1.5 min-w-[155px] z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-sm rounded-lg transition-colors cursor-pointer block ${
                    isSelected
                      ? 'bg-[#EDE9FE] text-[#3a2088] font-medium'
                      : 'text-[#0f3b6c] hover:bg-slate-50 font-normal'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const WorkflowExecutionsTable: React.FC<WorkflowExecutionsTableProps> = ({
  executions = []
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | ExecutionStatus>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('all');
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null);

  // Filtered list
  const filteredExecutions = useMemo(() => {
    const now = Date.now();
    return executions.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      if (timeFilter !== 'all' && item.createdAt) {
        const itemTime = new Date(item.createdAt).getTime();
        const diffMs = now - itemTime;
        if (timeFilter === '1hour' && diffMs > 3600 * 1000) return false;
        if (timeFilter === '24hours' && diffMs > 24 * 3600 * 1000) return false;
        if (timeFilter === '7days' && diffMs > 7 * 24 * 3600 * 1000) return false;
        if (timeFilter === '30days' && diffMs > 30 * 24 * 3600 * 1000) return false;
      }
      return true;
    });
  }, [executions, statusFilter, timeFilter]);

  const totalCount = filteredExecutions.length;
  const pageRangeText = totalCount === 0 ? '0-0 of 0' : `1-${totalCount} of ${totalCount}`;

  const renderStatusBadge = (status: ExecutionStatus) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-normal">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Success
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 text-[#DC2626] border border-rose-200 font-normal">
            <XCircle className="w-3 h-3 text-[#DC2626]" /> Failed
          </span>
        );
      case 'sleeping':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-normal">
            <Moon className="w-3 h-3 text-indigo-600" /> Sleeping
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-normal">
            <Clock className="w-3 h-3 text-amber-600" /> Waiting
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-normal">
            <Hourglass className="w-3 h-3 text-slate-500" /> Pending
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white font-sans select-none overflow-hidden">
      {/* Top Filter & Pagination Bar */}
      <div className="h-12 px-6 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
        {/* Left: Pagination Controls */}
        <div className="flex items-center gap-3 text-xs text-slate-500 font-normal">
          <button
            type="button"
            disabled={true}
            className="p-1 rounded text-slate-300 hover:text-slate-500 disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>{pageRangeText}</span>
          <button
            type="button"
            disabled={true}
            className="p-1 rounded text-slate-300 hover:text-slate-500 disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Custom Floating Popover Filters */}
        <div className="flex items-center gap-3">
          {/* Status Filter Dropdown */}
          <CustomDropdown
            value={statusFilter}
            options={statusOptions}
            onChange={(val) => setStatusFilter(val)}
            icon={<Filter className="w-3.5 h-3.5 text-slate-400" />}
          />

          {/* Time Filter Dropdown */}
          <CustomDropdown
            value={timeFilter}
            options={timeOptions}
            onChange={(val) => setTimeFilter(val)}
            icon={<Clock className="w-3.5 h-3.5 text-slate-400" />}
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-auto bg-slate-50/40 p-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs font-normal border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-700 font-medium">
                <th className="py-3 px-6 w-1/4">Execution</th>
                <th className="py-3 px-6 w-1/4">Lead</th>
                <th className="py-3 px-6 w-1/4">Status</th>
                <th className="py-3 px-6 w-1/4">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredExecutions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center text-slate-500 font-normal">
                    No executions found
                  </td>
                </tr>
              ) : (
                filteredExecutions.map((exec) => (
                  <tr
                    key={exec.id}
                    onClick={() => setSelectedExecution(exec)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-6">
                      <div className="font-medium text-slate-900">{exec.id}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{exec.triggerName} • {exec.timestamp}</div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="text-slate-800 font-normal">{exec.leadName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{exec.leadPhone}</div>
                    </td>
                    <td className="py-3 px-6">
                      {renderStatusBadge(exec.status)}
                    </td>
                    <td className="py-3 px-6 text-slate-600 font-mono text-[11px]">
                      {exec.duration}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Details Modal (When row clicked) */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  Execution Run: {selectedExecution.id}
                </h3>
                <p className="text-[10px] text-slate-500 font-normal">
                  {selectedExecution.timestamp} • Lead: {selectedExecution.leadName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExecution(null)}
                className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 overflow-y-auto max-h-[50vh]">
              {selectedExecution.logs && selectedExecution.logs.length > 0 ? (
                selectedExecution.logs.map((log) => (
                  <div key={log.step} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-800">Step {log.step}: {log.title}</span>
                      <span className={log.status === 'success' ? 'text-emerald-600 text-[10px]' : 'text-rose-600 text-[10px]'}>
                        {log.status === 'success' ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">{log.message}</p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 font-normal">
                  All step actions executed in {selectedExecution.duration}.
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-slate-100 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedExecution(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-[#3a2088] text-white rounded hover:bg-[#2c186b] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
