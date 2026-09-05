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
import { getWorkflowExecutionsFromDb } from '../../utils/workflowStorage';

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
    onReconnect,
    onReconnectStart,
    onReconnectEnd,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    addNodeFromCatalog,
    updateNodeData,
    deleteNode,
    workflowName,
    setWorkflowName,
    workflowStatus,
    isSaved,
    saveWorkflow
  } = useWorkflowGraph(initialWorkflow);

  const [activeTab, setActiveTab] = useState<'editor' | 'executions'>('editor');
  const [executions, setExecutions] = useState<ExecutionRecord[]>(() => 
    getWorkflowExecutionsFromDb(initialWorkflow?.id)
  );

  // Sync executions when active workflow changes
  React.useEffect(() => {
    setExecutions(getWorkflowExecutionsFromDb(initialWorkflow?.id));
  }, [initialWorkflow?.id]);

  const [saveToast, setSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Workflow published & saved!');

  const handleSave = (status?: 'draft' | 'published') => {
    const targetStatus = status || 'published';
    const serialized = saveWorkflow(targetStatus);
    onSave?.(serialized);
    setToastMessage(targetStatus === 'published' ? 'Workflow published & active!' : 'Workflow saved as draft!');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50 text-slate-900 font-sans select-none">
      {/* ================= HEADER / TOPBAR ================= */}
      <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 shadow-2xs">
        {/* Left: Back Arrow + Inline Editable Workflow Name + Status Indicator */}
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

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Workflow Name"
              className="text-sm sm:text-base font-semibold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1.5 focus:ring-[#3a2088]/40 border border-transparent hover:border-slate-200 focus:border-[#3a2088] rounded-md px-2.5 py-1 outline-none transition-all w-48 sm:w-64 truncate"
              title="Click to edit workflow name"
            />
            
            {/* Status & Saved state badge */}
            <div className="hidden sm:flex items-center">
              {!isSaved ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Unsaved Changes
                </span>
              ) : workflowStatus === 'published' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Draft
                </span>
              )}
            </div>
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

        {/* Right: Save as Draft & Publish Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-all border border-slate-200 shadow-2xs"
            title="Save workflow as draft without publishing"
          >
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
            title="Publish workflow and activate automations"
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
              onReconnect={onReconnect}
              onReconnectStart={onReconnectStart}
              onReconnectEnd={onReconnectEnd}
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
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
