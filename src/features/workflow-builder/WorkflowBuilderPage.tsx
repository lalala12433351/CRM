import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  CheckCircle2
} from 'lucide-react';
import { SidebarAccordion } from './components/SidebarAccordion';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { NodeConfigDrawer } from './components/NodeConfigDrawer';
import { WorkflowExecutionsTable, ExecutionRecord } from './components/WorkflowExecutionsTable';
import { useWorkflowGraph } from './hooks/useWorkflowGraph';
import { CatalogItem, WorkflowSerialized } from './types/workflow.types';

interface WorkflowBuilderPageProps {
  initialWorkflow?: WorkflowSerialized;
  onBack?: () => void;
  onSave?: (workflow: WorkflowSerialized) => void;
}

export const WorkflowBuilderPage: React.FC<WorkflowBuilderPageProps> = ({
  initialWorkflow,
  onBack,
  onSave
}) => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    addNodeFromCatalog,
    updateNodeData,
    deleteNode,
    workflowName,
    setWorkflowName,
    saveWorkflow
  } = useWorkflowGraph(initialWorkflow);

  const initialSampleExecutions: ExecutionRecord[] = [
    {
      id: '#EX-8902',
      triggerName: 'New Facebook Lead Ingest',
      leadName: 'Amit Sharma',
      leadPhone: '+91 98123 45678',
      status: 'success',
      duration: '0.8s',
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
      logs: [
        { step: 1, title: 'Lead Ingest Fired', status: 'success', message: 'Payload received from webhook listener' },
        { step: 2, title: 'Condition Evaluated', status: 'success', message: 'Phone valid & fresh lead stage verified' },
        { step: 3, title: 'Action Dispatched', status: 'success', message: 'WhatsApp template sent successfully' }
      ]
    },
    {
      id: '#EX-8901',
      triggerName: 'Website Contact Form',
      leadName: 'Priya Patel',
      leadPhone: '+91 98765 43210',
      status: 'sleeping',
      duration: '15m delay',
      timestamp: '15 mins ago',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      logs: [
        { step: 1, title: 'Form Submitted', status: 'success', message: 'Contact form webhook triggered' },
        { step: 2, title: 'Delay Timer Active', status: 'success', message: 'Sleeping for 15 minutes before follow-up' }
      ]
    },
    {
      id: '#EX-8900',
      triggerName: 'WhatsApp Inbound Message',
      leadName: 'Rahul Verma',
      leadPhone: '+91 91234 56789',
      status: 'waiting',
      duration: '2h window',
      timestamp: '45 mins ago',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      logs: [
        { step: 1, title: 'Incoming WA Message', status: 'success', message: 'Opt-in confirmed' },
        { step: 2, title: 'Waiting for Agent Reply', status: 'success', message: 'Assigned to Round Robin queue' }
      ]
    },
    {
      id: '#EX-8899',
      triggerName: 'Meta Lead Ad Trigger',
      leadName: 'Neha Singh',
      leadPhone: '+91 99887 76655',
      status: 'pending',
      duration: 'Queued',
      timestamp: '2 hours ago',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      logs: [
        { step: 1, title: 'Lead Ad Event Ingested', status: 'success', message: 'Queued for API rate-limit dispatch' }
      ]
    },
    {
      id: '#EX-8898',
      triggerName: 'API Webhook Inbound',
      leadName: 'Vikram Malhotra',
      leadPhone: '+91 90011 22334',
      status: 'failed',
      duration: '1.2s',
      timestamp: '5 hours ago',
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      logs: [
        { step: 1, title: 'Webhook Triggered', status: 'success', message: 'Payload received' },
        { step: 2, title: 'HTTP Post Failed', status: 'failed', message: 'CRM endpoint returned 502 Bad Gateway' }
      ]
    },
    {
      id: '#EX-8897',
      triggerName: 'Manual Campaign Trigger',
      leadName: 'Ananya Roy',
      leadPhone: '+91 97711 22334',
      status: 'success',
      duration: '0.6s',
      timestamp: 'Yesterday',
      createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      logs: [
        { step: 1, title: 'Campaign Start', status: 'success', message: 'Lead enrolled in sequence' },
        { step: 2, title: 'Template Sent', status: 'success', message: 'Delivered' }
      ]
    },
    {
      id: '#EX-8896',
      triggerName: 'Meta Lead Ad Trigger',
      leadName: 'Sanjay Gupta',
      leadPhone: '+91 95544 33221',
      status: 'success',
      duration: '0.9s',
      timestamp: '4 days ago',
      createdAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
      logs: [
        { step: 1, title: 'Lead Synced', status: 'success', message: 'Meta CAPI triggered' }
      ]
    }
  ];

  const [activeTab, setActiveTab] = useState<'editor' | 'executions'>('editor');
  const [executions] = useState<ExecutionRecord[]>(initialSampleExecutions);
  const [saveToast, setSaveToast] = useState(false);

  const handleSave = (status?: 'draft' | 'published') => {
    const serialized = saveWorkflow(status);
    onSave?.(serialized);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50 text-slate-900 font-sans select-none">
      {/* ================= HEADER / TOPBAR ================= */}
      <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 shadow-2xs">
        {/* Left: Back Arrow + Inline Editable Workflow Name */}
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#3a2088] hover:bg-purple-50 transition-colors cursor-pointer border border-transparent hover:border-purple-200"
              title="Back to Workflows"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Workflow Name"
              className="text-sm sm:text-base font-semibold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1.5 focus:ring-[#3a2088]/40 border border-transparent hover:border-slate-200 focus:border-[#3a2088] rounded-md px-2.5 py-1 outline-none transition-all w-48 sm:w-64 truncate"
              title="Click to edit workflow name"
            />
          </div>
        </div>

        {/* Center: Editor & Executions Tabs */}
        <div className="flex items-center gap-8 h-full">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`h-full px-4 text-sm sm:text-base font-semibold transition-all border-b-2 cursor-pointer flex items-center ${
              activeTab === 'editor'
                ? 'border-[#3a2088] text-[#3a2088]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('executions')}
            className={`h-full px-4 text-sm sm:text-base font-semibold transition-all border-b-2 cursor-pointer flex items-center ${
              activeTab === 'executions'
                ? 'border-[#3a2088] text-[#3a2088]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Executions
          </button>
        </div>

        {/* Right: Publish Action Only */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave('published')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>
        </div>
      </header>

      {/* ================= WORKSPACE (Editor vs Executions) ================= */}
      {activeTab === 'editor' ? (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar Catalog */}
          <SidebarAccordion
            hasTrigger={nodes.some((n) => n.type === 'trigger' || n.data?.kind === 'trigger')}
            onItemClick={(item: CatalogItem) => addNodeFromCatalog(item)}
          />

          {/* Center Interactive Canvas */}
          <main className="flex-1 h-full relative bg-[#f8fafc]">
            <WorkflowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              onAddNode={(item, pos) => addNodeFromCatalog(item, pos)}
              selectedNodeId={selectedNodeId}
            />
          </main>

          {/* Right Configuration Drawer */}
          {selectedNode && (
            <NodeConfigDrawer
              selectedNode={selectedNode}
              onClose={() => setSelectedNodeId(null)}
              onUpdateNodeData={updateNodeData}
              onDeleteNode={deleteNode}
            />
          )}
        </div>
      ) : (
        <WorkflowExecutionsTable executions={executions} />
      )}

      {/* ================= SAVE TOAST ================= */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-3.5 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">Workflow configuration saved!</span>
        </div>
      )}
    </div>
  );
};
