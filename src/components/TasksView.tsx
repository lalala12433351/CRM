import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Search,
  ChevronDown,
  Download,
  ListFilter,
  Flag,
  Trash2,
  Check,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Edit3,
  DollarSign,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { Agent, CrmTask, formatDealValue } from '../types';
import { isAgentAdmin } from '../types';

interface TasksViewProps {
  agents: Agent[];
  activeAgent?: Agent | null;
  tasks: CrmTask[];
  currency?: string;
  onCreateTask: (task: CrmTask) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: 'Pending' | 'Completed' | 'Rejected') => void;
  onUpdateTask?: (taskId: string, updates: Partial<CrmTask>) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  High:   'bg-rose-50 text-rose-700 border-rose-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low:    'bg-slate-50 text-slate-600 border-slate-200',
};

export const TasksView: React.FC<TasksViewProps> = ({
  agents,
  activeAgent,
  tasks,
  currency = 'INR',
  onCreateTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onUpdateTask,
}) => {
  const isAdmin = isAgentAdmin(activeAgent);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Completed' | 'Rejected'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [activeDropdown, setActiveDropdown] = useState<'status' | 'priority' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Create Task State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState(agents[0]?.id || '');
  const [newDueDay, setNewDueDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [newHour, setNewHour] = useState('09');
  const [newMinute, setNewMinute] = useState('00');
  const [newAmPm, setNewAmPm] = useState<'AM' | 'PM'>('AM');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskValue, setNewTaskValue] = useState<number | ''>('');

  // Edit Task State
  const [editingTask, setEditingTask] = useState<CrmTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editPriority, setEditPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [editStatus, setEditStatus] = useState<'Pending' | 'Completed' | 'Rejected'>('Pending');
  const [editTaskValue, setEditTaskValue] = useState<number | ''>('');
  const [editDueDay, setEditDueDay] = useState('');
  const [editHour, setEditHour] = useState('09');
  const [editMinute, setEditMinute] = useState('00');
  const [editAmPm, setEditAmPm] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleTasks = tasks.filter((t) => {
    if (!isAdmin) {
      return t.assigneeAgentId === activeAgent?.id || t.assigneeAgentName === activeAgent?.name;
    }
    return true;
  }).filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate Metrics
  const pendingTasks = visibleTasks.filter(t => t.status === 'Pending');
  const completedTasks = visibleTasks.filter(t => t.status === 'Completed');
  const totalPipelineTaskValue = pendingTasks.reduce((sum, t) => sum + (t.taskValue || 0), 0);

  // Task Value Handler: Restrict to maximum 9 digits
  const handleTaskValueChange = (val: string, setter: (v: number | '') => void) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 9);
    setter(digitsOnly ? Number(digitsOnly) : '');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    let h = parseInt(newHour, 10);
    if (newAmPm === 'PM' && h !== 12) h += 12;
    if (newAmPm === 'AM' && h === 12) h = 0;
    const combinedDate = `${newDueDay}T${String(h).padStart(2, '0')}:${newMinute}:00`;
    
    if (!newTitle.trim() || !newAssigneeId || !newDueDay) return;
    const assignee = agents.find(a => a.id === newAssigneeId);
    const safeTaskValue = typeof newTaskValue === 'number' ? Math.min(newTaskValue, 999999999) : 0;
    
    const task: CrmTask = {
      id: `crm-task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      assigneeAgentId: newAssigneeId,
      assigneeAgentName: assignee?.name || 'Unassigned',
      dueDate: combinedDate,
      priority: newPriority,
      status: 'Pending',
      taskValue: safeTaskValue,
      createdAt: new Date().toISOString(),
      createdByAdminId: activeAgent?.id,
    };

    onCreateTask(task);

    setNewTitle('');
    setNewDesc('');
    setNewDueDay(new Date().toISOString().slice(0, 10));
    setNewHour('09');
    setNewMinute('00');
    setNewAmPm('AM');
    setNewAssigneeId(agents[0]?.id || '');
    setNewPriority('Medium');
    setNewTaskValue('');
    setShowCreateModal(false);
  };

  const handleOpenEditModal = (task: CrmTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditAssigneeId(task.assigneeAgentId);
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditTaskValue(task.taskValue ?? '');

    if (task.dueDate) {
      try {
        const d = new Date(task.dueDate);
        setEditDueDay(d.toISOString().slice(0, 10));
        let h = d.getHours();
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        setEditHour(String(h).padStart(2, '0'));
        setEditMinute(String(Math.round(d.getMinutes() / 5) * 5 % 60).padStart(2, '0'));
        setEditAmPm(period);
      } catch {
        setEditDueDay(new Date().toISOString().slice(0, 10));
      }
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !onUpdateTask) return;

    let h = parseInt(editHour, 10);
    if (editAmPm === 'PM' && h !== 12) h += 12;
    if (editAmPm === 'AM' && h === 12) h = 0;
    const combinedDate = `${editDueDay}T${String(h).padStart(2, '0')}:${editMinute}:00`;

    const assignee = agents.find(a => a.id === editAssigneeId);
    const safeTaskValue = typeof editTaskValue === 'number' ? Math.min(editTaskValue, 999999999) : 0;

    onUpdateTask(editingTask.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      assigneeAgentId: editAssigneeId,
      assigneeAgentName: assignee?.name || editingTask.assigneeAgentName,
      priority: editPriority,
      status: editStatus,
      dueDate: combinedDate,
      taskValue: safeTaskValue,
    });

    setEditingTask(null);
  };

  const statusIcon = (status: string) => {
    if (status === 'Completed') return <CheckCircle2 className="w-3 h-3" />;
    if (status === 'Rejected') return <XCircle className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  const statusCls = (status: string) => {
    if (status === 'Completed') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (status === 'Rejected') return 'text-rose-700 bg-rose-50 border-rose-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  return (
    <div className="bg-white min-h-full font-sans text-slate-800">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-4">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Tasks & Activity Database</h1>
              <button className="p-1 rounded text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer" title="Refresh Tasks">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin ? 'Create, retrieve, edit, and track task values and team deliverables.' : 'Tasks assigned to you with value metrics.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>

        {/* KPI Metrics Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Total Tasks</span>
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 mt-1">{visibleTasks.length}</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Pending Tasks</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm font-bold text-amber-600 mt-1">{pendingTasks.length}</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Completed Tasks</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-emerald-600 mt-1">{completedTasks.length}</p>
          </div>

          <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-indigo-900 font-semibold">
              <span>Pending Task Revenue</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-sm font-bold text-indigo-950 font-mono mt-1">
              {formatDealValue(totalPipelineTaskValue, currency)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50/60 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all font-sans"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-sans relative" ref={dropdownRef}>
            {/* Status */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${activeDropdown === 'status' ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
              >
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Status:</span>
                <span className="font-semibold">{statusFilter === 'all' ? 'All' : statusFilter}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeDropdown === 'status' ? 'rotate-180' : ''}`} />
              </button>
              {activeDropdown === 'status' && (
                <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-50">
                  {(['all', 'Pending', 'Completed', 'Rejected'] as const).map((opt) => (
                    <button key={opt} onClick={() => { setStatusFilter(opt); setActiveDropdown(null); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${statusFilter === opt ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}>
                      <span>{opt === 'all' ? 'All Statuses' : opt}</span>
                      {statusFilter === opt && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'priority' ? null : 'priority')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${activeDropdown === 'priority' ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
              >
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Priority:</span>
                <span className="font-semibold">{priorityFilter === 'all' ? 'All' : priorityFilter}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeDropdown === 'priority' ? 'rotate-180' : ''}`} />
              </button>
              {activeDropdown === 'priority' && (
                <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-50">
                  {(['all', 'High', 'Medium', 'Low'] as const).map((opt) => (
                    <button key={opt} onClick={() => { setPriorityFilter(opt); setActiveDropdown(null); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${priorityFilter === opt ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}>
                      <span>{opt === 'all' ? 'All Priorities' : opt}</span>
                      {priorityFilter === opt && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); setPriorityFilter('all'); }}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold px-2.5 py-1.5 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer">
              Reset
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between py-2">
          <p className="text-sm"><span className="font-bold text-slate-900">{visibleTasks.length}</span> <span className="text-slate-500">tasks found</span></p>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs cursor-pointer">
              <Download className="w-3.5 h-3.5" /><span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Tasks Database Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider">TASK NAME</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider w-1/4">DESCRIPTION</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider text-right font-mono">TASK VALUE</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">ASSIGNEE</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">STATUS</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider">DUE DATE</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">PRIORITY</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400 text-sm">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                      {isAdmin ? 'No tasks found. Click "Create Task" to add tasks to database.' : 'No tasks assigned to you yet.'}
                    </td>
                  </tr>
                ) : visibleTasks.map((task) => {
                  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                  const isOverdue = dueDate && dueDate < new Date() && task.status === 'Pending';
                  const initials = task.assigneeAgentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-3 font-medium text-slate-900">{task.title}</td>
                      <td className="p-3 text-slate-500 text-xs max-w-xs truncate">
                        {task.description || <span className="italic text-slate-300">No description</span>}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700 font-mono">
                        {formatDealValue(task.taskValue || 0, currency)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center space-y-0.5">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold border border-indigo-200">{initials}</div>
                          <span className="text-[10px] text-slate-500 max-w-[80px] truncate">{task.assigneeAgentName.split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusCls(task.status)}`}>
                          {statusIcon(task.status)}<span>{task.status}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {dueDate ? dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          {isOverdue && <span className="ml-1 text-[10px] text-rose-600 uppercase font-bold">(Overdue)</span>}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PRIORITY_STYLES[task.priority]}`}>
                          <Flag className="w-2.5 h-2.5" /><span>{task.priority}</span>
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {task.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => onUpdateTaskStatus(task.id, 'Completed')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                title="Mark Completed"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onUpdateTaskStatus(task.id, 'Rejected')}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Reject Task"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(task)}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                title="Edit Task & Value"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteTask(task.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: Create Task */}
        {showCreateModal && isAdmin && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Create Task with Value</span>
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Conduct Enterprise Demo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Description</label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Task details and expectations..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      Task Value ({currency}) <span className="text-slate-400 font-normal lowercase">(max 9 digits)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={9}
                      value={newTaskValue}
                      onChange={(e) => handleTaskValueChange(e.target.value, setNewTaskValue)}
                      placeholder="e.g. 50000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Assign To *</label>
                    <select
                      required
                      value={newAssigneeId}
                      onChange={(e) => setNewAssigneeId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="">Select Employee</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.role || 'Employee'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={newDueDay}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setNewDueDay(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Edit Task & Task Value */}
        {editingTask && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>Edit Task & Task Value</span>
                </h3>
                <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Description</label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      Task Value ({currency}) <span className="text-slate-400 font-normal lowercase">(max 9 digits)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={9}
                      value={editTaskValue}
                      onChange={(e) => handleTaskValueChange(e.target.value, setEditTaskValue)}
                      placeholder="e.g. 50000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Assignee</label>
                    <select
                      value={editAssigneeId}
                      onChange={(e) => setEditAssigneeId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as 'Pending' | 'Completed' | 'Rejected')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Due Date</label>
                    <input
                      type="date"
                      value={editDueDay}
                      onChange={(e) => setEditDueDay(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
