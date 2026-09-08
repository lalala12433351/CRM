import React, { memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { WorkflowNodeData } from '../../types/workflow.types';
import { MoreVertical, AlertCircle } from 'lucide-react';
import { ConditionFilterChipsBar } from '../../../../components/ConditionFilterChipsBar';
import { DynamicCondition } from '../../../../utils/conditionFilterEngine';

export const ConditionNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const config = nodeData.config || {};
  const conditions: DynamicCondition[] = Array.isArray(config.conditions)
    ? config.conditions
    : [];

  const { setNodes } = useReactFlow();

  const handleUpdateCondition = (condId: string, updates: Partial<DynamicCondition>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const currentConditions: DynamicCondition[] = (node.data as any)?.config?.conditions || [];
          const updated = currentConditions.map((c) => (c.id === condId ? { ...c, ...updates } : c));
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...(node.data as any)?.config,
                conditions: updated
              }
            }
          };
        }
        return node;
      })
    );
  };

  const handleRemoveCondition = (condId: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const currentConditions: DynamicCondition[] = (node.data as any)?.config?.conditions || [];
          const updated = currentConditions.filter((c) => c.id !== condId);
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...(node.data as any)?.config,
                conditions: updated
              }
            }
          };
        }
        return node;
      })
    );
  };

  return (
    <div
      className={`relative min-w-[280px] max-w-[540px] rounded-2xl bg-white border font-sans shadow-xs transition-all ${
        selected
          ? 'border-purple-600 ring-2 ring-purple-400/20 shadow-md'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Target Input Handle (Left - White ring with gray border) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3.5 !h-3.5 !bg-white !border-2 !border-slate-300 !rounded-full !cursor-crosshair shadow-xs"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#50289B] text-white rounded-t-2xl">
        <span className="text-xs font-bold text-white tracking-tight">
          {config.conditionType || nodeData.label || 'Check If Whatsapp Message'}
        </span>
        <button type="button" className="text-white/90 hover:text-white p-0.5 rounded cursor-pointer">
          <MoreVertical className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Node Body */}
      <div className="p-3.5 bg-white rounded-b-2xl">
        {conditions.length === 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
            <span>Select Condition</span>
          </div>
        ) : (
          <ConditionFilterChipsBar
            activeConditions={conditions}
            onUpdateCondition={handleUpdateCondition}
            onRemoveCondition={handleRemoveCondition}
          />
        )}
      </div>

      {/* True Handle (Green ring - Met condition) */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '48%' }}
        className="!w-3.5 !h-3.5 !bg-white !border-2 !border-[#10B981] !rounded-full !cursor-crosshair shadow-xs"
      />

      {/* False Handle (Red ring - Unmet condition) */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '65%' }}
        className="!w-3.5 !h-3.5 !bg-white !border-2 !border-[#EF4444] !rounded-full !cursor-crosshair shadow-xs"
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

