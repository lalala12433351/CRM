import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  X
} from 'lucide-react';

export interface ExecutionRecord {
  id: string;
  triggerName: string;
  leadName: string;
  leadPhone: string;
  status: 'success' | 'failed' | 'running';
  duration: string;
  timestamp: string;
  logs?: { step: number; title: string; status: 'success' | 'failed'; message: string }[];
}

interface WorkflowExecutionsTableProps {
  executions?: ExecutionRecord[];
}

export const WorkflowExecutionsTable: React.FC<WorkflowExecutionsTableProps> = ({
  executions = []
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'running'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null);

  // Filtered list
  const filteredExecutions = useMemo(() => {
    return executions.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      return true;
    });
  }, [executions, statusFilter]);

  const totalCount = filteredExecutions.length;
  const pageRangeText = totalCount === 0 ? '0-0 of 0' : `1-${totalCount} of ${totalCount}`;

  return (
    <div className="flex-1 flex flex-col h-full bg-white font-sans select-none overflow-hidden">
      {/* Top Filter & Pagination Bar (Matching Image 2) */}
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

        {/* Right: Filters */}
        <div className="flex items-center gap-3">
          {/* Status Filter Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="appearance-none text-xs font-normal text-slate-700 bg-white border border-slate-200 rounded-md pl-7 pr-7 py-1.5 focus:outline-none focus:border-[#3a2088] cursor-pointer shadow-2xs"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="running">In Progress</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
            <span className="text-[10px] text-slate-400 absolute right-2 pointer-events-none">▼</span>
          </div>

          {/* Time Filter Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="appearance-none text-xs font-normal text-slate-700 bg-white border border-slate-200 rounded-md pl-7 pr-7 py-1.5 focus:outline-none focus:border-[#3a2088] cursor-pointer shadow-2xs"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
            <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
            <span className="text-[10px] text-slate-400 absolute right-2 pointer-events-none">▼</span>
          </div>
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
                      {exec.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-normal">
                          <CheckCircle2 className="w-3 h-3" /> Success
                        </span>
                      )}
                      {exec.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-[#DC2626] border border-rose-200 font-normal">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                      {exec.status === 'running' && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-[#3a2088] border border-purple-200 font-normal">
                          <Loader2 className="w-3 h-3 animate-spin" /> In Progress
                        </span>
                      )}
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
                      <span className="text-emerald-600 text-[10px]">✓ Passed</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">{log.message}</p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 font-normal">
                  All step actions executed successfully in {selectedExecution.duration}.
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
