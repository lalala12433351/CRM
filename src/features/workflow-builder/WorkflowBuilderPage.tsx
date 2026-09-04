import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Play,
  FileCode,
  RotateCcw,
  Sparkles,
  Layers,
  Check,
  Copy,
  Activity,
  X,
  CheckCircle2,
  GitBranch,
  Edit3
} from 'lucide-react';
import { SidebarAccordion } from './components/SidebarAccordion';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { NodeConfigDrawer } from './components/NodeConfigDrawer';
import { useWorkflowGraph } from './hooks/useWorkflowGraph';
import { CatalogItem, WorkflowSerialized } from './types/workflow.types';
import { SAMPLE_TEMPLATES } from './constants/workflowCatalog';

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
    clearCanvas,
    loadTemplate,
    workflowName,
    setWorkflowName,
    workflowStatus,
    setWorkflowStatus,
    isSaved,
    serializeWorkflow,
    saveWorkflow,
    runSimulation,
    stopSimulation,
    isSimulating,
    simulationLogs
  } = useWorkflowGraph(initialWorkflow);

  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const handleSave = (status?: 'draft' | 'published') => {
    const serialized = saveWorkflow(status);
    onSave?.(serialized);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(serializeWorkflow(), null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleStartSimulation = () => {
    setShowSimulationModal(true);
    runSimulation();
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50 text-slate-900 font-sans select-none">
      {/* ================= HEADER / TOPBAR (CRM Styled) ================= */}
      <header className="h-16 bg-white border-b border-slate-200/90 px-4 md:px-6 flex items-center justify-between z-30 shrink-0 shadow-2xs">
        {/* Left: Back Arrow & Breadcrumb/Title */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-[#3a2088] hover:bg-purple-50 transition-colors cursor-pointer border border-transparent hover:border-purple-200"
              title="Back to Workflows"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Automations /</span>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="text-sm md:text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#3a2088] focus:outline-none px-1 py-0.5 max-w-xs sm:max-w-md transition-colors"
                />
              </div>

              {/* Status Badge */}
              <button
                type="button"
                onClick={() => setWorkflowStatus(workflowStatus === 'published' ? 'draft' : 'published')}
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full cursor-pointer transition-colors border ${
                  workflowStatus === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-[#EDE9FE] text-[#3a2088] border-[#DDD6FE]'
                }`}
                title="Click to toggle status"
              >
                {workflowStatus === 'published' ? 'Active' : 'Draft'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 pl-1">
              <span>{nodes.length} Nodes</span>
              <span>•</span>
              <span>{edges.length} Connectors</span>
              <span>•</span>
              <span className={isSaved ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                {isSaved ? 'Saved' : 'Unsaved changes'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Templates Selector */}
          <button
            type="button"
            onClick={() => loadTemplate('tpl-instant-welcome')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200/90 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3a2088]" />
            <span>Preset Template</span>
          </button>

          {/* Reset / Clear */}
          <button
            type="button"
            onClick={clearCanvas}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            title="Clear canvas"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* JSON Schema */}
          <button
            type="button"
            onClick={() => setShowJsonModal(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON Output</span>
          </button>

          {/* Test Simulation Button */}
          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-50 text-[#3a2088] border border-purple-200 hover:bg-purple-100 transition-colors shadow-2xs cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 text-[#3a2088] ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Testing...' : 'Test Run Flow'}</span>
          </button>

          {/* Save & Publish Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="hidden lg:flex px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => handleSave('published')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3a2088] hover:bg-[#2c186b] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Publish</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= WORKSPACE ================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Catalog */}
        <SidebarAccordion
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

      {/* ================= SAVE TOAST ================= */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">Workflow configuration saved successfully!</span>
        </div>
      )}

      {/* ================= JSON OUTPUT MODAL ================= */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-[#3a2088]">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Serialized Workflow JSON
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Clean execution payload formatted for backend workflow engine
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowJsonModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-950">
              <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
                {JSON.stringify(serializeWorkflow(), null, 2)}
              </pre>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Ready for execution</span>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#3a2088] text-white hover:bg-[#2c186b] cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SIMULATION MODAL ================= */}
      {showSimulationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#3a2088] text-white">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Flow Execution Simulation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Simulating trigger payload and evaluating condition branches
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopSimulation();
                  setShowSimulationModal(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {simulationLogs.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-[#3a2088] border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">Evaluating workflow steps...</p>
                </div>
              ) : (
                simulationLogs.map((step) => (
                  <div
                    key={step.step}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-3 animate-in fade-in duration-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-emerald-200">
                      ✓
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Step {step.step}: {step.nodeName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {step.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {step.log}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {isSimulating ? 'Executing step-by-step...' : 'Simulation complete! All checks passed.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-[#3a2088] border border-purple-200 hover:bg-purple-100 cursor-pointer"
                >
                  Re-test
                </button>
                <button
                  type="button"
                  onClick={() => setShowSimulationModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#3a2088] text-white hover:bg-[#2c186b] cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
