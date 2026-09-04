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
  Panel,
  ConnectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode } from './nodes/TriggerNode';
import { ConditionNode } from './nodes/ConditionNode';
import { ActionNode } from './nodes/ActionNode';
import { CustomWorkflowNode, CatalogItem } from '../types/workflow.types';
import { Edge, Connection } from '@xyflow/react';
import { Sparkles } from 'lucide-react';

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
      event.dataTransfer.dropEffect = 'move';

      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      try {
        const item: CatalogItem = JSON.parse(rawData);

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
    <div ref={reactFlowWrapper} className="w-full h-full relative bg-[#f8fafc] overflow-hidden">
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
        connectionMode={ConnectionMode.Loose}
        connectionRadius={40}
        connectOnClick={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3a2088', strokeWidth: 2 }
        }}
        className="w-full h-full font-sans"
      >

        {/* Background Grid */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          className="opacity-70"
          color="#cbd5e1"
        />

        {/* Controls Panel (Reduced Curves) */}
        <Controls
          showInteractive={false}
          className="!bg-white !border !border-slate-200/90 !rounded-lg !shadow-xs !overflow-hidden"
        />

        {/* MiniMap (Reduced Curves) */}
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            if (node.type === 'trigger') return '#3a2088';
            if (node.type === 'condition') return '#4f46e5';
            return '#475569';
          }}
          className="!bg-white/95 !border !border-slate-200/90 !rounded-lg !shadow-xs"
          maskColor="rgba(100, 116, 139, 0.1)"
        />

        {/* Empty Canvas Hint */}
        {nodes.length === 0 && (
          <Panel position="top-center" className="mt-20">
            <div className="bg-white border border-purple-200 p-5 rounded-lg shadow-xs max-w-md text-center space-y-2.5 font-sans">
              <div className="w-10 h-10 rounded-md bg-purple-50 border border-purple-200 text-[#3a2088] flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Design Your Workflow Pipeline
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Drag and drop a <strong>Trigger Event</strong> from the left sidebar to start, or load a preset template from the top bar.
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
