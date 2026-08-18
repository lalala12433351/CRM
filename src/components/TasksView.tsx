import React, { useState } from 'react';
import { 
  RefreshCw, 
  Upload, 
  Search, 
  ChevronDown, 
  Download, 
  ListFilter,
  Flag,
  Maximize2,
  Phone,
  Check
} from 'lucide-react';
import { Lead, Agent } from '../types';

interface TasksViewProps {
  leads: Lead[];
  agents: Agent[];
  onOpenLeadDetail?: (lead: Lead) => void;
  onCallLead?: (lead: Lead) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  leads,
  agents,
  onOpenLeadDetail = () => {},
  onCallLead = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<'Call Followups' | 'Todo'>('Call Followups');
  const [searchQuery, setSearchQuery] = useState('');

  // Use leads as tasks for the UI
  const tasks = leads.map(lead => ({
    id: lead.id,
    taskName: lead.name,
    description: lead.notes || 'No description',
    assigneeInitials: lead.ownerAgentName ? lead.ownerAgentName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'UN',
    assigneeColor: lead.ownerAgentId === 'agent-ms' ? 'text-indigo-700 bg-indigo-50 border-indigo-200' : 
                   lead.ownerAgentId === 'agent-pk' ? 'text-rose-700 bg-rose-50 border-rose-200' :
                   'text-amber-700 bg-amber-50 border-amber-200',
    status: 'LATE',
    dueDate: '3M ago',
    originalLead: lead
  }));

  const filteredTasks = tasks.filter(t => t.taskName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-white min-h-full font-sans text-slate-800">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Tasks</h1>
              <button className="p-1 rounded text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Never miss a followup by creating task <a href="#" className="text-indigo-600 hover:underline">Learn More</a>
            </p>
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-indigo-200 text-indigo-600 bg-white rounded-lg hover:bg-indigo-50 font-medium text-sm transition-colors shadow-xs cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload tasks</span>
          </button>
        </div>

        {/* Tabs & Add Task Type */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setActiveTab('Call Followups')}
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'Call Followups' ? 'border-indigo-600 text-indigo-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Call Followups
            </button>
            <button 
              onClick={() => setActiveTab('Todo')}
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'Todo' ? 'border-indigo-600 text-indigo-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Todo
            </button>
          </div>
          <button className="text-indigo-600 text-sm font-medium hover:underline flex items-center space-x-1 cursor-pointer">
            <span>+</span> <span>Add task type</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search on description" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filters Dropdowns */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
              <span className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-r border-slate-200">For</span>
              <button className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-1">
                <span>Me</span>
              </button>
              <button className="px-3 py-2 text-sm text-indigo-700 bg-indigo-50 font-medium flex items-center space-x-1 border-l border-slate-200">
                <span>Team...</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
              <span className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-r border-slate-200">Due</span>
              <button className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-1 min-w-[100px] justify-between">
                <span>All</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
              <span className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-r border-slate-200">Status</span>
              <button className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-1 justify-between">
                <span>Pending, Late</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
              <span className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-r border-slate-200">Priority</span>
              <button className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-1 min-w-[80px] justify-between">
                <span className="invisible">A</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
              <span className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-r border-slate-200">Creator</span>
              <button className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-1 min-w-[80px] justify-between">
                <span>All</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
              <span className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-r border-slate-200">Created On</span>
              <button className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-1 min-w-[80px] justify-between">
                <span>All</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <button className="text-indigo-600 text-sm font-medium hover:underline px-2">
              Reset
            </button>
          </div>
        </div>

        {/* Results Bar */}
        <div className="flex items-center justify-between py-2">
          <p className="text-sm">
            <span className="font-bold text-slate-900">{filteredTasks.length}</span> <span className="text-slate-500">matching tasks</span>
          </p>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 text-sm border border-slate-200 rounded px-2.5 py-1.5 shadow-xs">
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <div className="flex items-center text-sm text-slate-500 space-x-1">
              <span>Sorted by</span>
              <span className="text-slate-800 font-medium cursor-pointer">Due date</span>
              <ListFilter className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <th className="p-3 w-12 text-center">
                    <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  </th>
                  <th className="p-3 font-medium text-xs uppercase tracking-wider">TASK NAME</th>
                  <th className="p-3 font-medium text-xs uppercase tracking-wider w-1/3">DESCRIPTION</th>
                  <th className="p-3 font-medium text-xs uppercase tracking-wider text-center">ASSIGNEE</th>
                  <th className="p-3 font-medium text-xs uppercase tracking-wider text-center">STATUS</th>
                  <th className="p-3 font-medium text-xs uppercase tracking-wider">DUE DATE <span className="inline-block align-middle"><ChevronDown className="w-3 h-3" /></span></th>
                  <th className="p-3 font-medium text-xs uppercase tracking-wider text-center">PRIORITY</th>
                  <th className="p-3 font-medium text-xs uppercase tracking-wider text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.slice(0, 20).map((task, idx) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-3 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => onOpenLeadDetail(task.originalLead)}
                        className="font-medium text-slate-700 hover:text-indigo-600 flex items-center space-x-1 cursor-pointer"
                      >
                        <span>{task.taskName}</span>
                        <Maximize2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="p-3 text-slate-400 italic">
                      No description
                    </td>
                    <td className="p-3 text-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto border cursor-pointer ${task.assigneeColor}`}>
                        <span className="strike-through line-through opacity-70 absolute w-8 h-[1px] bg-current transform rotate-45"></span>
                        {task.assigneeInitials}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-rose-600 font-bold text-xs uppercase">{task.status}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1 text-rose-600 text-xs font-medium cursor-pointer hover:underline">
                        <span>{task.dueDate}</span>
                        <ChevronDown className="w-3 h-3" />
                      </div>
                    </td>
                    <td className="p-3 text-center text-slate-400 cursor-pointer hover:text-slate-600">
                      <Flag className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center space-x-2 opacity-100">
                        <button 
                          onClick={() => onOpenLeadDetail(task.originalLead)}
                          className="p-1.5 rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onCallLead(task.originalLead)}
                          className="p-1.5 rounded border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-4 py-4 text-sm text-slate-600">
          <span>1-20 of {filteredTasks.length}</span>
          <div className="flex items-center space-x-1">
            <button className="p-1.5 rounded border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 cursor-pointer">
              <ChevronDown className="w-4 h-4 transform rotate-90" />
            </button>
            <button className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">
              <ChevronDown className="w-4 h-4 transform -rotate-90" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
