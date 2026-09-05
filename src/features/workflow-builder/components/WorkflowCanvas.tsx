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
  ConnectionMode,
  ConnectionLineType,
  Edge,
  Connection,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode } from './nodes/TriggerNode';
import { ConditionNode } from './nodes/ConditionNode';
import { ActionNode } from './nodes/ActionNode';
import { CustomWorkflowNode, CatalogItem } from '../types/workflow.types';
import { Plus } from 'lucide-react';
import { WorkflowIcon } from './WorkflowIcons';
import { ConnectionLineComponentProps, getSmoothStepPath } from '@xyflow/react';

interface WorkflowCanvasProps {
  nodes: CustomWorkflowNode[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: (connection: Connection) => void;
  onReconnect?: (oldEdge: Edge, newConnection: Connection) => void;
  onReconnectStart?: () => void;
  onReconnectEnd?: (event: MouseEvent | TouchEvent, edge: Edge) => void;
  onNodeClick: (node: CustomWorkflowNode) => void;
  onPaneClick: () => void;
  onAddNode: (item: CatalogItem, position?: { x: number; y: number }) => void;
  selectedNodeId: string | null;
}

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode
};

// Clean connection line with guaranteed pointer-events none
const WorkflowConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  connectionStatus
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
    borderRadius: 12
  });

  const isSnapped = connectionStatus === 'valid';

  return (
    <g style={{ pointerEvents: 'none' }}>
      <path
        fill="none"
        stroke={isSnapped ? '#10b981' : '#3a2088'}
        strokeWidth={isSnapped ? 3 : 2.5}
        strokeDasharray={isSnapped ? undefined : '6,6'}
        className="react-flow__connection-path"
        d={edgePath}
        style={{ pointerEvents: 'none' }}
      />
      {/* Snapping dot indicator at cursor */}
      <circle
        cx={toX}
        cy={toY}
        fill={isSnapped ? '#10b981' : '#3a2088'}
        r={isSnapped ? 6 : 4}
        stroke="#ffffff"
        strokeWidth={2}
        style={{ pointerEvents: 'none' }}
      />
    </g>
  );
};

const FlowCanvasInternal: React.FC<WorkflowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onReconnect,
  onReconnectStart,
  onReconnectEnd,
  onNodeClick,
  onPaneClick,
  onAddNode,
  selectedNodeId
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

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
        onConnect={(conn) => {
          console.log('[WorkflowCanvas onConnect] FIRED with payload:', conn);
          onConnect(conn);
        }}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onConnectStart={(event, params) => {
          console.log('[WorkflowCanvas onConnectStart] Drag started from handle:', params);
        }}
        onConnectEnd={(event) => {
          console.log('[WorkflowCanvas onConnectEnd] Drag finished / mouse released');
        }}
        isValidConnection={(edge) => {
          console.log('[WorkflowCanvas isValidConnection] Validating:', edge);
          return true;
        }}
        onNodeClick={(_, node) => onNodeClick(node as CustomWorkflowNode)}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={60}
        reconnectRadius={40}
        edgesReconnectable={true}
        edgesFocusable={true}
        connectOnClick={false}
        nodesConnectable={true}
        elevateEdgesOnSelect={true}
        deleteKeyCode={['Backspace', 'Delete']}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          reconnectable: true,
          style: { stroke: '#3a2088', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3a2088',
            width: 14,
            height: 14
          }
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

        {/* Controls Panel */}
        <Controls
          showInteractive={false}
          className="!bg-white !border !border-slate-200/90 !rounded-lg !shadow-xs !overflow-hidden"
        />

        {/* MiniMap */}
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
                <WorkflowIcon id="custom_action_created" size={20} className="text-[#3a2088]" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Design Your Workflow Pipeline
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Drag and drop a <strong>Trigger Event</strong> from the left sidebar to start.
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
