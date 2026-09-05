import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { WorkflowNodeData } from '../../types/workflow.types';
import { Check, X } from 'lucide-react';

export const ConditionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const rules = nodeData.config?.rules || [];

  return (
    <div
      className={`relative min-w-[270px] max-w-[300px] rounded-lg bg-white border font-sans transition-all duration-150 shadow-xs ${
        selected
          ? 'border-[#3a2088] ring-2 ring-[#3a2088]/20 shadow-md'
          : 'border-indigo-200/90 hover:border-[#3a2088]'
      }`}
    >
      {/* Target Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={true}
        className="!w-4 !h-4 !bg-[#3a2088] !border-2 !border-white !rounded-full !pointer-events-auto !cursor-crosshair hover:!scale-125 transition-transform !z-50 shadow-sm"
        style={{
          boxShadow: '0 0 0 1.5px #3a2088'
        }}
      />

      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#3a2088] text-white rounded-t-lg">
        <div className="text-[11px] font-medium tracking-wider uppercase">
          <span>CONDITION (IF / ELSE)</span>
        </div>
      </div>

      {/* Node Body */}
      <div className="p-4">
        <div className="text-xs font-normal text-slate-800 truncate">
          {nodeData.label || 'Condition Check'}
        </div>

        {/* Rule Summaries */}
        {rules.length > 0 && (
          <div className="mt-2.5 space-y-1.5 bg-slate-50 p-2 rounded-md border border-slate-200/80 text-[11px]">
            {rules.slice(0, 2).map((rule, idx) => (
              <div key={rule.id || idx} className="flex items-center justify-between text-slate-700 font-mono text-[10px]">
                <span className="text-[#3a2088] font-medium">{rule.field}</span>
                <span className="text-slate-400 text-[9px]">{rule.operator.replace('_', ' ')}</span>
                <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 max-w-[90px] truncate text-slate-700 font-normal">
                  {rule.value || '""'}
                </span>
              </div>
            ))}
            {rules.length > 2 && (
              <div className="text-[10px] text-slate-400 text-center font-normal">
                +{rules.length - 2} more conditions
              </div>
            )}
          </div>
        )}

        {/* Dual Branching Port Labels */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between font-normal">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700">
              <Check className="w-2 h-2 stroke-[2.5]" />
            </span>
            <span>IF TRUE</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#DC2626] font-medium">
            <span>IF FALSE</span>
            <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-rose-100 border border-rose-300 text-[#DC2626]">
              <X className="w-2 h-2 stroke-[2.5]" />
            </span>
          </div>
        </div>
      </div>

      {/* True Handle (Green Dot on Upper Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        isConnectable={true}
        className="!w-4 !h-4 !bg-[#10b981] !border-2 !border-white !rounded-full !pointer-events-auto !cursor-crosshair hover:!scale-125 transition-transform !z-50 shadow-sm"
        style={{
          top: '40%',
          boxShadow: '0 0 0 1.5px #10b981'
        }}
      />

      {/* False Handle (Red Dot on Lower Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        isConnectable={true}
        className="!w-4 !h-4 !bg-[#DC2626] !border-2 !border-white !rounded-full !pointer-events-auto !cursor-crosshair hover:!scale-125 transition-transform !z-50 shadow-sm"
        style={{
          top: '78%',
          boxShadow: '0 0 0 1.5px #DC2626'
        }}
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
