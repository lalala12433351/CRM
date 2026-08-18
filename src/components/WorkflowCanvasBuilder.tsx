import React, { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare, 
  PhoneCall, 
  UserCheck, 
  Clock, 
  FileSpreadsheet, 
  Sparkles, 
  Bot, 
  Layers,
  ChevronDown,
  Info,
  Check
} from 'lucide-react';
import { WorkflowRule } from '../types';

interface WorkflowCanvasBuilderProps {
  workflow?: WorkflowRule;
  onSaveWorkflow?: (workflow: WorkflowRule) => void;
  onClose?: () => void;
}

interface CanvasNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  title: string;
  subtitle: string;
  iconType: 'zap' | 'filter' | 'whatsapp' | 'call' | 'assign' | 'sheets' | 'ai';
  color: string;
  config: Record<string, any>;
}

export const WorkflowCanvasBuilder: React.FC<WorkflowCanvasBuilderProps> = ({
  workflow,
  onSaveWorkflow,
  onClose,
}) => {
  const [nodes, setNodes] = useState<CanvasNode[]>([
    {
      id: 'node-1',
      type: 'trigger',
      title: 'Trigger: New Lead Ingested',
      subtitle: 'Webhook from Facebook Ads or IndiaMart',
      iconType: 'zap',
      color: 'border-amber-400 bg-amber-50/70 text-amber-900',
      config: { source: 'Facebook Ads, IndiaMart', delay: 'Instant (0s)' }
    },
    {
      id: 'node-2',
      type: 'condition',
      title: 'Branch: Evaluate Deal Value & Rating',
      subtitle: 'If Deal Value ≥ ₹75,000 OR AI Score ≥ 80',
      iconType: 'filter',
      color: 'border-indigo-400 bg-indigo-50/70 text-indigo-950',
      config: { field: 'dealValue', operator: '>=', value: 75000 }
    },
    {
      id: 'node-3',
      type: 'action',
      title: 'Action: Instant WhatsApp Welcome',
      subtitle: 'Dispatch official Template "welcome_brochure_v2"',
      iconType: 'whatsapp',
      color: 'border-emerald-400 bg-emerald-50/70 text-emerald-950',
      config: { template: 'welcome_brochure_v2', media: 'PDF Catalog' }
    },
    {
      id: 'node-4',
      type: 'action',
      title: 'Action: Round-Robin Assign Agent',
      subtitle: 'Assign to active telecaller (Madhava / Priya)',
      iconType: 'assign',
      color: 'border-violet-400 bg-violet-50/70 text-violet-950',
      config: { rule: 'Round Robin (Available Agents Only)' }
    },
    {
      id: 'node-5',
      type: 'action',
      title: 'Action: AI Voice Bot Qualification Call',
      subtitle: 'Trigger autonomous voice bot if uncontacted after 15m',
      iconType: 'ai',
      color: 'border-pink-400 bg-pink-50/70 text-pink-950',
      config: { timeoutMinutes: 15, botScript: 'B2B Enterprise Discovery' }
    }
  ]);

  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleTestRun = () => {
    setIsSimulating(true);
    setExecutionLogs([]);
    setActiveStepIndex(0);

    nodes.forEach((node, idx) => {
      setTimeout(() => {
        setActiveStepIndex(idx);
        setExecutionLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✓ Executed: ${node.title} — ${node.subtitle}`
        ]);
        if (idx === nodes.length - 1) {
          setTimeout(() => {
            setIsSimulating(false);
            setActiveStepIndex(null);
            setExecutionLogs(prev => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] 🚀 Workflow Simulation Completed Successfully with 100% SLA!`
            ]);
          }, 800);
        }
      }, (idx + 1) * 700);
    });
  };

  const handleAddNode = (type: 'condition' | 'action', title: string, subtitle: string, iconType: any, color: string) => {
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type,
      title,
      subtitle,
      iconType,
      color,
      config: {}
    };
    setNodes(prev => [...prev, newNode]);
    setShowAddMenu(false);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'zap': return <Zap className="w-4 h-4 text-amber-600" />;
      case 'filter': return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'call': return <PhoneCall className="w-4 h-4 text-blue-600" />;
      case 'assign': return <UserCheck className="w-4 h-4 text-violet-600" />;
      case 'sheets': return <FileSpreadsheet className="w-4 h-4 text-teal-600" />;
      case 'ai': return <Bot className="w-4 h-4 text-pink-600" />;
      default: return <Zap className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Toolbar */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900">Interactive Visual Workflow Studio</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Active Automation
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Drag, connect, and simulate automated lead routing and instant WhatsApp communication flows.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTestRun}
            disabled={isSimulating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center space-x-1.5"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating Live Flow...' : 'Test Run Workflow'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas View */}
      <div className="p-6 bg-[#f8fafc] min-h-[420px] flex flex-col items-center justify-start space-y-3 relative overflow-x-auto">
        
        {nodes.map((node, index) => {
          const isActive = activeStepIndex === index;
          return (
            <React.Fragment key={node.id}>
              {/* Visual Node Card */}
              <div 
                className={`w-full max-w-lg bg-white rounded-2xl border-2 p-4 shadow-sm transition-all duration-300 relative group ${
                  isActive 
                    ? 'ring-4 ring-emerald-300 border-emerald-500 scale-102 bg-emerald-50/40' 
                    : node.color
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
                      {getNodeIcon(node.iconType)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                        <span>{node.title}</span>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{node.subtitle}</div>
                    </div>
                  </div>

                  {node.type !== 'trigger' && (
                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded-md transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Connecting Connector Arrow between nodes */}
              {index < nodes.length - 1 && (
                <div className="flex flex-col items-center my-0.5">
                  <div className={`w-0.5 h-4 transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div className={`w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-emerald-500 ring-4 ring-emerald-200' : 'bg-slate-400'}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Add Node Button & Popover */}
        <div className="pt-2 relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs cursor-pointer flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Add Next Step / Action</span>
          </button>

          {showAddMenu && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 space-y-1 text-xs">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Step to Append
              </div>
              <button
                onClick={() => handleAddNode('action', 'Action: Send SMS Notification', 'Trigger DLT registered SMS gateway', 'whatsapp', 'border-sky-400 bg-sky-50/70 text-sky-950')}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>Send SMS Backup</span>
              </button>
              <button
                onClick={() => handleAddNode('action', 'Action: Push to Google Sheets', 'Append row to Master Pipeline Spreadsheet', 'sheets', 'border-teal-400 bg-teal-50/70 text-teal-950')}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                <span>Sync to Google Sheets</span>
              </button>
              <button
                onClick={() => handleAddNode('action', 'Action: Schedule Callback Task', 'Create high-priority reminder in agent queue', 'call', 'border-blue-400 bg-blue-50/70 text-blue-950')}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Schedule Callback Task</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Execution Simulation Console */}
      {executionLogs.length > 0 && (
        <div className="p-4 bg-slate-900 text-slate-200 border-t border-slate-800 text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Workflow Execution Simulator Logs</span>
          </div>
          {executionLogs.map((log, i) => (
            <div key={i} className="text-slate-300">{log}</div>
          ))}
        </div>
      )}
    </div>
  );
};
