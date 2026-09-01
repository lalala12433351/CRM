import React, { useState } from 'react';
import { 
  GitBranch, 
  RotateCw, 
  Plus, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  FileText, 
  Code, 
  Webhook, 
  Info, 
  Search, 
  ChevronDown,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  LayoutGrid,
  Layers
} from 'lucide-react';
import { WorkflowRule } from '../types';
import { WorkflowCanvasBuilder } from './WorkflowCanvasBuilder';

export type AutomationsSubTab = 'workflows' | 'schedules' | 'salesform' | 'api_templates' | 'webhooks';

interface WorkflowsViewProps {
  workflows: WorkflowRule[];
  onToggleWorkflow: (id: string) => void;
  onAddWorkflow: (rule: WorkflowRule) => void;
  initialSubTab?: AutomationsSubTab;
  onShowToast?: (message: string) => void;
}

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({
  workflows,
  onToggleWorkflow,
  onAddWorkflow,
  initialSubTab = 'workflows',
  onShowToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AutomationsSubTab>(initialSubTab);
  const [workflowViewMode, setWorkflowViewMode] = useState<'visual' | 'table'>('visual');
  const [timeRange, setTimeRange] = useState<'All' | '24h' | '7d' | '30d'>('24h');
  const [scheduleSubTab, setScheduleSubTab] = useState<'Published' | 'Draft'>('Published');
  const [salesformSubTab, setSalesformSubTab] = useState<'Published' | 'Draft'>('Published');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('On');
  const [eventTypeFilter, setEventTypeFilter] = useState('Select Event Types');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalTrigger, setModalTrigger] = useState('Lead Creation');
  const [modalEndpoint, setModalEndpoint] = useState('https://graph.facebook.com/v25.0/2...');

  // Live Data for Schedules
  const [schedules, setSchedules] = useState<any[]>([]);

  // Live Data for Salesforms
  const [salesforms, setSalesforms] = useState<any[]>([]);

  // Live Data for API Templates
  const [apiTemplates, setApiTemplates] = useState<any[]>([]);

  // Handle Toast
  const triggerToast = (msg: string) => {
    if (onShowToast) onShowToast(msg);
  };

  // Handle duplicate row
  const handleDuplicate = (name: string) => {
    triggerToast(`Duplicated flowchart: "${name}"`);
  };

  const handleDelete = (id: string, name: string) => {
    triggerToast(`Removed "${name}"`);
  };

  return (
    <div className="p-3 md:p-6 space-y-5 max-w-7xl mx-auto text-slate-900 font-sans">
      
      {/* TOP AUTOMATIONS NAVIGATION BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveSubTab('workflows')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'workflows'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Workflows</span>
          </button>

          <button
            onClick={() => setActiveSubTab('schedules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'schedules'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Schedules</span>
          </button>

          <button
            onClick={() => setActiveSubTab('salesform')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'salesform'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Salesforms</span>
          </button>

          <button
            onClick={() => setActiveSubTab('api_templates')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'api_templates'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>API Templates</span>
          </button>

          <button
            onClick={() => setActiveSubTab('webhooks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeSubTab === 'webhooks'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Webhook className="w-4 h-4" />
            <span>Webhooks</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>TeleCRM Flow Engine</span>
        </div>
      </div>

      {/* VIEW 1: WORKFLOWS */}
      {activeSubTab === 'workflows' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <GitBranch className="w-5 h-5 text-purple-600" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>Workflows & Automations</span>
                <button 
                  onClick={() => triggerToast('Refreshing Workflows...')}
                  className="text-slate-400 hover:text-purple-600 transition-colors p-1" 
                  title="Refresh Workflows"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 text-xs font-bold text-slate-600">
                <button
                  onClick={() => setWorkflowViewMode('visual')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                    workflowViewMode === 'visual' ? 'bg-white text-purple-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Visual Studio</span>
                </button>
                <button
                  onClick={() => setWorkflowViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                    workflowViewMode === 'table' ? 'bg-white text-purple-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Rule Registry</span>
                </button>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
              >
                <span>Create Workflow</span>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {workflowViewMode === 'visual' && (
            <div className="space-y-4">
              <WorkflowCanvasBuilder />
            </div>
          )}

          {/* Stats Box & Time Range Switcher */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-2xs">
            <div className="flex justify-end">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 text-xs font-bold text-slate-600">
                {(['All', '24h', '7d', '30d'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      timeRange === t ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 5 Stats Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Total Runs</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-xl font-extrabold text-slate-900">107</p>
                <p className="text-[10px] text-slate-400 font-mono">last {timeRange}</p>
              </div>

              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Success</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-xl font-extrabold text-emerald-600">100%</p>
                <p className="text-[10px] text-slate-400 font-mono">last {timeRange}</p>
              </div>

              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Failed</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-xl font-extrabold text-rose-500">0</p>
                <p className="text-[10px] text-slate-400 font-mono">last {timeRange}</p>
              </div>

              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Sleeping</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-xl font-extrabold text-slate-900">0</p>
                <p className="text-[10px] text-slate-400 font-mono">last {timeRange}</p>
              </div>

              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Waiting for Reply</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-xl font-extrabold text-slate-900">0</p>
                <p className="text-[10px] text-slate-400 font-mono">last {timeRange}</p>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-1">
              <input
                type="text"
                placeholder="Search flowchart by Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 shadow-2xs"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-purple-50/70 border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-purple-900 focus:outline-none cursor-pointer"
              >
                <option value="On">On</option>
                <option value="Off">Off</option>
                <option value="All">All Statuses</option>
              </select>
            </div>

            <div>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="Select Event Types">Select Event Types</option>
                <option value="Lead Creation">Lead Creation</option>
                <option value="Lead Status Change">Lead Status Change</option>
                <option value="Call Log">Call Log</option>
              </select>
            </div>
          </div>

          {/* Workflows Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Events</th>
                    <th className="py-3 px-4 flex items-center space-x-1">
                      <span>Status</span>
                      <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                    </th>
                    <th className="py-3 px-4">Total runs</th>
                    <th className="py-3 px-4">Last 24h runs/failures</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* Row 1 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-xs">On Website lead</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold">
                        Lead Creation
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                        <span className="text-[10px] text-slate-400 mt-1 font-mono">9d ago by Faisal C</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">726</td>
                    <td className="py-3.5 px-4 font-bold font-mono">
                      <span className="text-slate-900">10</span> / <span className="text-rose-600">0</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button 
                          onClick={() => handleDuplicate('On Website lead')}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete('wf-1', 'On Website lead')}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 2 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-xs">On Lead Status Change</p>
                      <button 
                        onClick={() => triggerToast('Opening Draft Editor...')}
                        className="text-[10px] text-slate-400 hover:text-purple-600 underline font-mono cursor-pointer"
                      >
                        View Draft
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold">
                        Lead Status Change
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                        <span className="text-[10px] text-slate-400 mt-1 font-mono">1M ago by Faisal C</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">16051</td>
                    <td className="py-3.5 px-4 font-bold font-mono">
                      <span className="text-slate-900">65</span> / <span className="text-rose-600">0</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button 
                          onClick={() => handleDuplicate('On Lead Status Change')}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete('wf-2', 'On Lead Status Change')}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-xs">On call log lead</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold">
                        Lead Creation +9
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                        <span className="text-[10px] text-slate-400 mt-1 font-mono">2M ago by Faisal C</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">805</td>
                    <td className="py-3.5 px-4 font-bold font-mono">
                      <span className="text-slate-900">3</span> / <span className="text-rose-600">0</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button 
                          onClick={() => handleDuplicate('On call log lead')}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete('wf-3', 'On call log lead')}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SCHEDULES */}
      {activeSubTab === 'schedules' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>Schedules</span>
                <button 
                  onClick={() => triggerToast('Refreshing Schedules...')}
                  className="text-slate-400 hover:text-purple-600 transition-colors p-1"
                  title="Refresh Schedules"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </h1>
              <p className="text-xs text-slate-500 hidden md:block">
                To automatically keep in touch with your leads{' '}
                <a href="#learn" onClick={(e) => { e.preventDefault(); alert('Schedules trigger automatic recurring messages or drip workflows based on time delays.'); }} className="text-purple-600 hover:underline font-semibold">
                  Learn More
                </a>
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>Create New Schedule</span>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Stats Container (3 Stats Cards) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-2xs">
            <div className="flex justify-end">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 text-xs font-bold text-slate-600">
                {(['All', '24h', '7d', '30d'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      timeRange === t ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Total Runs</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-xl font-extrabold text-slate-900">0</p>
                <p className="text-[10px] text-slate-400 font-mono">last {timeRange}</p>
              </div>

              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Success</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-xl font-extrabold text-emerald-600">0%</p>
                <p className="text-[10px] text-slate-400 font-mono">last {timeRange}</p>
              </div>

              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Failed</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-xl font-extrabold text-rose-500">0</p>
                <p className="text-[10px] text-slate-400 font-mono">last {timeRange}</p>
              </div>
            </div>
          </div>

          {/* Sub-tabs: Published & Draft */}
          <div className="border-b border-slate-200 flex items-center space-x-6 text-xs font-bold">
            <button
              onClick={() => setScheduleSubTab('Published')}
              className={`pb-2.5 transition-all cursor-pointer ${
                scheduleSubTab === 'Published'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setScheduleSubTab('Draft')}
              className={`pb-2.5 transition-all cursor-pointer ${
                scheduleSubTab === 'Draft'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Draft
            </button>
          </div>

          {/* Search Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-1">
              <input
                type="text"
                placeholder="Search flowchart by Name"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 shadow-2xs"
              />
            </div>

            <div>
              <select
                className="w-full bg-purple-50/70 border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-purple-900 focus:outline-none cursor-pointer"
              >
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>

            <div>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="Select Event Types">Select Event Types</option>
                <option value="Time Trigger">Time Trigger</option>
              </select>
            </div>
          </div>

          {/* Schedules Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Events</th>
                    <th className="py-3 px-4 flex items-center space-x-1">
                      <span>Status</span>
                      <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                    </th>
                    <th className="py-3 px-4">Last run</th>
                    <th className="py-3 px-4">Last run status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {schedules.filter(s => scheduleSubTab === 'Draft' ? s.isDraft : !s.isDraft).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                        No Flowcharts Found
                      </td>
                    </tr>
                  ) : (
                    schedules.filter(s => scheduleSubTab === 'Draft' ? s.isDraft : !s.isDraft).map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{sch.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold">
                            {sch.events}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked={sch.status} className="sr-only peer" />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{sch.lastRun}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">{sch.lastRunStatus}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button 
                              onClick={() => handleDuplicate(sch.name)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(sch.id, sch.name)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SALESFORMS */}
      {activeSubTab === 'salesform' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <FileText className="w-5 h-5 text-purple-600" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>Salesforms</span>
                <button 
                  onClick={() => triggerToast('Refreshing Salesforms...')}
                  className="text-slate-400 hover:text-purple-600 transition-colors p-1"
                  title="Refresh Salesforms"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </h1>
              <p className="text-xs text-slate-500 hidden md:block">
                To automatically fill lead form data
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>Create Salesform</span>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-tabs: Published & Draft */}
          <div className="border-b border-slate-200 flex items-center space-x-6 text-xs font-bold">
            <button
              onClick={() => setSalesformSubTab('Published')}
              className={`pb-2.5 transition-all cursor-pointer ${
                salesformSubTab === 'Published'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setSalesformSubTab('Draft')}
              className={`pb-2.5 transition-all cursor-pointer ${
                salesformSubTab === 'Draft'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Draft
            </button>
          </div>

          {/* Search Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <input
                type="text"
                placeholder="Search salesform by Name"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 shadow-2xs"
              />
            </div>

            <div>
              <select className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer shadow-2xs">
                <option value="Status">Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Salesforms Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Events</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 flex items-center space-x-1">
                      <span>Status Updated On</span>
                      <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                    </th>
                    <th className="py-3 px-4">Status Updated by</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {salesforms.map((sf) => (
                    <tr key={sf.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-purple-700 hover:underline cursor-pointer">
                        {sf.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold">
                          {sf.events}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded bg-purple-600 text-white font-bold text-[10px] uppercase tracking-wider">
                          ON
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{sf.statusUpdatedOn}</td>
                      <td className="py-3.5 px-4">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center font-mono border border-purple-200">
                          {sf.statusUpdatedBy}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button 
                            onClick={() => handleDuplicate(sf.name)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(sf.id, sf.name)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: API TEMPLATES */}
      {activeSubTab === 'api_templates' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <Code className="w-5 h-5 text-purple-600" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>API Templates</span>
                <button 
                  onClick={() => triggerToast('Refreshing API Templates...')}
                  className="text-slate-400 hover:text-purple-600 transition-colors p-1"
                  title="Refresh API Templates"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </h1>
              <p className="text-xs text-slate-500 hidden md:block">
                Create an API template once and use it everywhere
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>Create New</span>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* API Templates Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Template Name</th>
                    <th className="py-3 px-4">Endpoint URL</th>
                    <th className="py-3 px-4">Variables Used</th>
                    <th className="py-3 px-4">Workflow</th>
                    <th className="py-3 px-4 flex items-center space-x-1">
                      <span>Last Modified</span>
                      <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                    </th>
                    <th className="py-3 px-4">Last Modified By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {apiTemplates.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{tpl.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 truncate max-w-xs">{tpl.endpoint}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold">
                          {tpl.variablesUsed}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {tpl.workflow === 'None' ? (
                          <span className="text-slate-400 italic">None</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                            {tpl.workflow}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{tpl.lastModified}</td>
                      <td className="py-3.5 px-4">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center font-mono border border-purple-200">
                          {tpl.lastModifiedBy}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => triggerToast(`Opening API Template "${tpl.name}"`)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="Open Template"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: WEBHOOK MANAGEMENT */}
      {activeSubTab === 'webhooks' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Webhook Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Incoming Webhook Connections from External Systems
            </p>
          </div>

          {/* Central Empty State Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200">
              <Webhook className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-base font-bold text-slate-900">No webhooks yet</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect external systems like Shopify, WooCommerce, or Razorpay to automatically create leads and trigger actions in Telecrm
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Webhook</span>
              </button>

              <div>
                <a 
                  href="#doc" 
                  onClick={(e) => { e.preventDefault(); alert('Incoming Webhook Endpoint URL:\nhttps://ais-dev-m6t4rquzc7bz5nfvm7berm-832098000404.asia-east1.run.app/api/webhook/ingest\n\nMethod: POST\nHeaders: Content-Type: application/json'); }}
                  className="text-xs font-semibold text-purple-600 hover:underline inline-flex items-center space-x-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View webhook documentation</span>
                </a>
              </div>
            </div>
          </div>

          {/* Webhook Getting Started Guide Card */}
          <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Webhook Getting Started Guide</h3>
              <button
                onClick={() => triggerToast('Opening Webhook API Docs...')}
                className="px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View documentation</span>
              </button>
            </div>

            <p className="text-xs text-slate-600">Follow these steps to set up your first webhook integration:</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1 text-xs">
                <p className="font-bold text-purple-900">1. Create a webhook endpoint</p>
                <p className="text-[11px] text-slate-500">Generate a unique URL to receive JSON payloads from external forms or tools.</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1 text-xs">
                <p className="font-bold text-purple-900">2. Map Lead Fields</p>
                <p className="text-[11px] text-slate-500">Match payload JSON fields (name, phone, source) directly to TeleCRM contact fields.</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1 text-xs">
                <p className="font-bold text-purple-900">3. Enable Auto-Dialer</p>
                <p className="text-[11px] text-slate-500">Automatically push incoming webhook leads into agent phone call queues in real time.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ITEM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Create {activeSubTab === 'workflows' ? 'Workflow' : activeSubTab === 'schedules' ? 'Schedule' : activeSubTab === 'salesform' ? 'Salesform' : activeSubTab === 'api_templates' ? 'API Template' : 'Webhook'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Configure trigger and automated action rule</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = modalName.trim() || `New ${activeSubTab.toUpperCase()} Rule`;
                if (activeSubTab === 'workflows') {
                  onAddWorkflow({
                    id: `wf-${Date.now()}`,
                    name,
                    description: 'Custom trigger rule created in app.',
                    triggerEvent: modalTrigger,
                    condition: 'All Leads',
                    actions: ['Assign Telecaller', 'Send Welcome WhatsApp'],
                    isActive: true,
                    executedCount: 0
                  });
                }
                triggerToast(`Created "${name}" successfully!`);
                setShowCreateModal(false);
                setModalName('');
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Automation Title *</label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="e.g., Immediate Meta Lead Instant Dialer"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Trigger Event</label>
                <select
                  value={modalTrigger}
                  onChange={(e) => setModalTrigger(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="Lead Creation">Lead Creation</option>
                  <option value="Lead Status Change">Lead Status Change</option>
                  <option value="On Call Log">On Call Log</option>
                  <option value="Scheduled Time">Scheduled Time</option>
                  <option value="Webhook Inbound">Webhook Inbound</option>
                </select>
              </div>

              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 text-slate-700 space-y-1 text-[11px]">
                <p className="font-bold text-purple-900 flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Auto-Execution Enabled</span>
                </p>
                <p className="text-slate-600">This flowchart will automatically process leads upon trigger events in real time.</p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all cursor-pointer shadow-xs"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
