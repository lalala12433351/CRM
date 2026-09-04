import React, { useRef, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode } from './nodes/TriggerNode';
import { ConditionNode } from './nodes/ConditionNode';
import { ActionNode } from './nodes/ActionNode';
import { CustomWorkflowNode, CatalogItem } from '../types/workflow.types';
import { Edge, Connection } from '@xyflow/react';
import { Sparkles, MousePointerClick, PlusCircle } from 'lucide-react';

interface WorkflowCanvasProps {
  nodes: CustomWorkflowNode[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: (connection: Connection) => void;
  onNodeClick: (node: CustomWorkflowNode) => void;
  onPaneClick: () => void;
  onAddNode: (item: CatalogItem, position?: { x: number; y: number }) => void;
  selectedNodeId: string | null;
}

const FlowCanvasInternal: React.FC<WorkflowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onAddNode,
  selectedNodeId
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      condition: ConditionNode,
      action: ActionNode
    }),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      try {
        const item: CatalogItem = JSON.parse(rawData);

        // Calculate flow position using React Flow coordinate projection
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY
        });

        onAddNode(item, position);
      } catch (err) {
        console.error('Failed to parse dropped workflow item:', err);
      }
    },
    [onAddNode, reactFlowInstance]
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick(node as CustomWorkflowNode)}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2 }
        }}
        className="touch-none select-none"
      >
        {/* Background Grid */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          className="opacity-60 dark:opacity-30"
          color="#94a3b8"
        />

        {/* Controls Panel */}
        <Controls
          showInteractive={false}
          className="!bg-white dark:!bg-slate-800 !border !border-slate-200 dark:!border-slate-700 !rounded-xl !shadow-lg !overflow-hidden"
        />

        {/* MiniMap */}
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            if (node.type === 'trigger') return '#9333ea';
            if (node.type === 'condition') return '#4f46e5';
            return '#475569';
          }}
          className="!bg-white/90 dark:!bg-slate-900/90 !border !border-slate-200 dark:!border-slate-800 !rounded-xl !shadow-md"
          maskColor="rgba(100, 116, 139, 0.15)"
        />

        {/* Top Hint Helper */}
        {nodes.length === 0 && (
          <Panel position="top-center" className="mt-20">
            <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 p-6 rounded-2xl shadow-xl max-w-md text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Start Building Your Workflow
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drag and drop a <strong>Trigger Event</strong> from the left sidebar to begin, or choose one of our pre-built automation templates.
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowCanvasInternal {...props} />
    </ReactFlowProvider>
  );
};
