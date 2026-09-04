import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Play,
  Share2,
  CheckCircle,
  FileCode,
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle,
  Check,
  Copy,
  ChevronDown,
  Activity,
  X
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
      {/* ================= TOPBAR ================= */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
        {/* Left Section: Back & Workflow Title */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Back to workflows"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-purple-500 focus:outline-none px-1 py-0.5 max-w-sm sm:max-w-md transition-colors"
              />
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  workflowStatus === 'published'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                }`}
              >
                {workflowStatus}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pl-1">
              <span>{nodes.length} Nodes</span>
              <span>•</span>
              <span>{edges.length} Connections</span>
              <span>•</span>
              <span className={isSaved ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                {isSaved ? 'All changes saved' : 'Unsaved changes'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Templates Dropdown */}
          <button
            type="button"
            onClick={() => loadTemplate('tpl-instant-welcome')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Load Template</span>
          </button>

          {/* Clear Canvas */}
          <button
            type="button"
            onClick={clearCanvas}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Clear canvas"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Export JSON Modal Button */}
          <button
            type="button"
            onClick={() => setShowJsonModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON Output</span>
          </button>

          {/* Test Simulation Button */}
          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : 'Test Run Flow'}</span>
          </button>

          {/* Publish / Save Button */}
          <div className="flex items-center rounded-lg shadow-sm">
            <button
              type="button"
              onClick={() => handleSave('published')}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-l-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Publish Flow</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-r-lg bg-purple-700 hover:bg-purple-800 text-purple-100 border-l border-purple-500 transition-colors"
              title="Save as Draft"
            >
              Save Draft
            </button>
          </div>
        </div>
      </header>

      {/* ================= WORKSPACE AREA ================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Catalog Accordion */}
        <SidebarAccordion
          onItemClick={(item: CatalogItem) => addNodeFromCatalog(item)}
        />

        {/* Center Canvas */}
        <main className="flex-1 h-full relative">
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
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">Workflow configuration saved successfully!</span>
        </div>
      )}

      {/* ================= JSON MODAL ================= */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Serialized Workflow JSON
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    TeleCRM standardized automation schema
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowJsonModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
              <span>Ready for execution backend engine</span>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SIMULATION MODAL ================= */}
      {showSimulationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Live Flow Execution Simulation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Testing pipeline triggers and condition evaluations
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopSimulation();
                  setShowSimulationModal(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
              {simulationLogs.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">Initializing simulation test run...</p>
                </div>
              ) : (
                simulationLogs.map((step) => (
                  <div
                    key={step.step}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3 animate-in fade-in duration-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Step {step.step}: {step.nodeName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {step.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {step.log}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {isSimulating ? 'Running workflow step by step...' : 'Simulation complete! All checks passed.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  Re-run Test
                </button>
                <button
                  type="button"
                  onClick={() => setShowSimulationModal(false)}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
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
