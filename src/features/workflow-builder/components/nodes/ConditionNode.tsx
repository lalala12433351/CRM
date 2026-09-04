import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DynamicIcon } from '../DynamicIcon';
import { WorkflowNodeData } from '../../types/workflow.types';
import { Filter, Check, X, GitBranch } from 'lucide-react';

export const ConditionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const rules = nodeData.config?.rules || [];
  const logicOp = nodeData.config?.logicOperator || 'AND';
  const conditionType = nodeData.config?.conditionType || 'lead';

  return (
    <div
      className={`relative min-w-[270px] max-w-[310px] rounded-xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-md ${
        selected
          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-indigo-500/10 shadow-lg dark:border-indigo-500'
          : 'border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-600'
      }`}
    >
      {/* Target Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3.5 !h-3.5 !bg-indigo-600 !border-2 !border-white dark:!border-slate-900 hover:!scale-125 !transition-transform !shadow-sm !-left-2"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-xl">
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
          <GitBranch className="w-3.5 h-3.5 text-indigo-200" />
          <span>CONDITION (IF / ELSE)</span>
        </div>
        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-medium capitalize backdrop-blur-xs">
          {conditionType} Filter
        </span>
      </div>

      {/* Node Body */}
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shrink-0">
            <DynamicIcon name={nodeData.iconName || 'Filter'} className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
              {nodeData.label || 'Condition Check'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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

        {/* Rule Summaries */}
        {rules.length > 0 && (
          <div className="mt-2.5 space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px]">
            {rules.slice(0, 2).map((rule, idx) => (
              <div key={rule.id || idx} className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{rule.field}</span>
                <span className="text-slate-400 text-[9px]">{rule.operator.replace('_', ' ')}</span>
                <span className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 max-w-[90px] truncate text-slate-700 dark:text-slate-200">
                  {rule.value || '""'}
                </span>
              </div>
            ))}
            {rules.length > 2 && (
              <div className="text-[10px] text-slate-400 text-center font-medium">
                +{rules.length - 2} more conditions
              </div>
            )}
          </div>
        )}

        {/* Dual Branching Port Labels */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span>IF TRUE</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            <span>IF FALSE</span>
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300">
              <X className="w-2.5 h-2.5 stroke-[3]" />
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
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-white dark:!border-slate-900 hover:!scale-125 !transition-transform !shadow-sm !-right-2"
      />

      {/* False Handle (Red Dot on Lower Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '75%' }}
        className="!w-3.5 !h-3.5 !bg-rose-500 !border-2 !border-white dark:!border-slate-900 hover:!scale-125 !transition-transform !shadow-sm !-right-2"
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
