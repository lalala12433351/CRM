import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DynamicIcon } from '../DynamicIcon';
import { WorkflowNodeData } from '../../types/workflow.types';
import { Check, X, GitBranch } from 'lucide-react';

export const ConditionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const rules = nodeData.config?.rules || [];
  const logicOp = nodeData.config?.logicOperator || 'AND';
  const conditionType = nodeData.config?.conditionType || 'lead';

  return (
    <div
      className={`relative min-w-[270px] max-w-[300px] rounded-lg bg-white border transition-all duration-200 shadow-xs ${
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
        className="!w-3 !h-3 !bg-[#3a2088] !border-2 !border-white hover:!scale-125 !transition-transform !shadow-xs !-left-1.5 cursor-pointer"
      />

      {/* Node Header (Solid Background, No Gradient, Reduced Curve) */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#3a2088] text-white rounded-t-lg">
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
          <GitBranch className="w-3.5 h-3.5 text-indigo-200" />
          <span>CONDITION (IF / ELSE)</span>
        </div>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold capitalize">
          {conditionType}
        </span>
      </div>

      {/* Node Body */}
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
            <DynamicIcon name={nodeData.iconName || 'Filter'} className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {nodeData.label || 'Condition Check'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {rules.length > 0 ? (
                <span>
                  Match {logicOp === 'AND' ? 'all' : 'any'} {rules.length} rule{rules.length > 1 ? 's' : ''}:
                </span>
              ) : (
                <span>No rules configured yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Rule Summaries (Reduced Curve) */}
        {rules.length > 0 && (
          <div className="mt-2.5 space-y-1.5 bg-slate-50 p-2 rounded-md border border-slate-200/80 text-[11px]">
            {rules.slice(0, 2).map((rule, idx) => (
              <div key={rule.id || idx} className="flex items-center justify-between text-slate-700 font-mono text-[10px]">
                <span className="text-[#3a2088] font-bold">{rule.field}</span>
                <span className="text-slate-400 text-[9px]">{rule.operator.replace('_', ' ')}</span>
                <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 max-w-[90px] truncate text-slate-800 font-semibold">
                  {rule.value || '""'}
                </span>
              </div>
            ))}
            {rules.length > 2 && (
              <div className="text-[10px] text-slate-400 text-center font-bold">
                +{rules.length - 2} more conditions
              </div>
            )}
          </div>
        )}

        {/* Dual Branching Port Labels */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
            <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700">
              <Check className="w-2 h-2 stroke-[3]" />
            </span>
            <span>IF TRUE</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#DC2626]">
            <span>IF FALSE</span>
            <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-rose-100 border border-rose-300 text-[#DC2626]">
              <X className="w-2 h-2 stroke-[3]" />
            </span>
          </div>
        </div>
      </div>

      {/* True Handle (Green Dot on Upper Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '35%' }}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white hover:!scale-125 !transition-transform !shadow-xs !-right-1.5 cursor-pointer"
      />

      {/* False Handle (Red Dot on Lower Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '75%' }}
        className="!w-3 !h-3 !bg-[#DC2626] !border-2 !border-white hover:!scale-125 !transition-transform !shadow-xs !-right-1.5 cursor-pointer"
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
