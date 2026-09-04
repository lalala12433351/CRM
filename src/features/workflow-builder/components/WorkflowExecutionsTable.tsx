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

const statusBadgeConfig: Record<
  ExecutionStatus,
  {
    label: string;
    bg: string;
    border: string;
    text: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    label: 'Success',
    bg: 'bg-[#ecfdf5]',
    border: 'border-[#6ee7b7]',
    text: 'text-[#059669]',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
  },
  sleeping: {
    label: 'Sleeping',
    bg: 'bg-[#eff2fe]',
    border: 'border-[#c4b5fd]',
    text: 'text-[#4f46e5]',
    icon: <Moon className="w-3.5 h-3.5 text-[#4f46e5]" />
  },
  waiting: {
    label: 'Waiting',
    bg: 'bg-[#fffbeb]',
    border: 'border-[#fde68a]',
    text: 'text-[#d97706]',
    icon: <Clock className="w-3.5 h-3.5 text-[#d97706]" />
  },
  pending: {
    label: 'Pending',
    bg: 'bg-[#f1f5f9]',
    border: 'border-[#cbd5e1]',
    text: 'text-[#334155]',
    icon: <Hourglass className="w-3.5 h-3.5 text-[#475569]" />
  },
  failed: {
    label: 'Failed',
    bg: 'bg-[#fff1f2]',
    border: 'border-[#fecdd3]',
    text: 'text-[#e11d48]',
    icon: <XCircle className="w-3.5 h-3.5 text-[#e11d48]" />
  }
};

const timeOptions: { value: TimeFilterOption; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: '1hour', label: 'Last Hour' },
  { value: '24hours', label: 'Last 24 Hours' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' }
];

export const WorkflowExecutionsTable: React.FC<WorkflowExecutionsTableProps> = ({
  executions = []
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | ExecutionStatus>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('all');
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target as Node)) {
        setIsTimeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    const config = statusBadgeConfig[status] || statusBadgeConfig.pending;
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium ${config.bg} ${config.border} ${config.text}`}
      >
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  const selectedTimeLabel = timeOptions.find((opt) => opt.value === timeFilter)?.label || 'All Time';

  return (
    <div className="flex-1 flex flex-col h-full bg-white font-sans select-none overflow-hidden">
      {/* Top Filter & Pagination Bar */}
      <div className="h-14 px-8 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
        {/* Left: Pagination Controls */}
        <div className="flex items-center gap-3 text-xs text-slate-500 font-normal">
          <button
            type="button"
            disabled={true}
            className="p-1 rounded text-slate-300 hover:text-slate-500 disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium text-slate-700">{pageRangeText}</span>
          <button
            type="button"
            disabled={true}
            className="p-1 rounded text-slate-300 hover:text-slate-500 disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Status & Time Dropdowns */}
        <div className="flex items-center gap-3">
          {/* Status Dropdown */}
          <div className="relative inline-block text-left" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="inline-flex items-center gap-2 text-xs font-normal text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#3a2088] cursor-pointer shadow-2xs transition-colors"
            >
              {statusFilter === 'all' ? (
                <>
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>All Statuses</span>
                </>
              ) : (
                renderStatusBadge(statusFilter)
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isStatusDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-xl shadow-xl p-1.5 min-w-[170px] z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="space-y-1">
                  {/* All Statuses option */}
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('all');
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-sm rounded-lg transition-colors cursor-pointer block ${
                      statusFilter === 'all'
                        ? 'bg-[#EDE9FE] text-[#3a2088] font-medium'
                        : 'text-[#0f3b6c] hover:bg-slate-50 font-normal'
                    }`}
                  >
                    All Statuses
                  </button>

                  {/* Individual Status Badges */}
                  {(['success', 'sleeping', 'waiting', 'pending', 'failed'] as ExecutionStatus[]).map(
                    (statusKey) => {
                      const isSelected = statusFilter === statusKey;
                      const cfg = statusBadgeConfig[statusKey];
                      return (
                        <button
                          key={statusKey}
                          type="button"
                          onClick={() => {
                            setStatusFilter(statusKey);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                            isSelected ? 'bg-purple-50 ring-1 ring-purple-300' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium ${cfg.bg} ${cfg.border} ${cfg.text}`}
                          >
                            {cfg.icon}
                            <span>{cfg.label}</span>
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Time Filter Dropdown */}
          <div className="relative inline-block text-left" ref={timeDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="inline-flex items-center gap-2 text-xs font-normal text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#3a2088] cursor-pointer shadow-2xs transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{selectedTimeLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isTimeDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isTimeDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-xl shadow-xl p-1.5 min-w-[155px] z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="space-y-0.5">
                  {timeOptions.map((opt) => {
                    const isSelected = opt.value === timeFilter;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setTimeFilter(opt.value);
                          setIsTimeDropdownOpen(false);
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
        </div>
      </div>

      {/* Main Table Container with Enhanced Left Padding */}
      <div className="flex-1 overflow-auto bg-slate-50/40 p-8">
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs font-normal border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-700 font-medium">
                <th className="py-4 px-8 w-[28%] text-left">Execution</th>
                <th className="py-4 px-8 w-[26%] text-left">Lead</th>
                <th className="py-4 px-8 w-[24%] text-left">Status</th>
                <th className="py-4 px-8 w-[22%] text-left">Duration</th>
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
                    <td className="py-4 px-8 text-left">
                      <div className="font-medium text-slate-900">{exec.id}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {exec.triggerName} • {exec.timestamp}
                      </div>
                    </td>
                    <td className="py-4 px-8 text-left">
                      <div className="text-slate-800 font-normal">{exec.leadName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {exec.leadPhone}
                      </div>
                    </td>
                    <td className="py-4 px-8 text-left">
                      {renderStatusBadge(exec.status)}
                    </td>
                    <td className="py-4 px-8 text-left text-slate-600 font-mono text-[11px]">
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
