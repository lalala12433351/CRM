import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DynamicIcon } from '../DynamicIcon';
import { WorkflowNodeData } from '../../types/workflow.types';
import { Zap, MoreVertical, CheckCircle2 } from 'lucide-react';

export const TriggerNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;

  return (
    <div
      className={`relative min-w-[260px] max-w-[300px] rounded-xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-md ${
        selected
          ? 'border-purple-600 ring-2 ring-purple-500/20 shadow-purple-500/10 shadow-lg dark:border-purple-500'
          : 'border-purple-200 dark:border-purple-900/60 hover:border-purple-400 dark:hover:border-purple-600'
      }`}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
          <Zap className="w-3.5 h-3.5 fill-purple-200 text-purple-200" />
          <span>EVENT (TRIGGER)</span>
        </div>
        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-medium backdrop-blur-xs">
          Entry Point
        </span>
      </div>

      {/* Node Body */}
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 shrink-0">
            <DynamicIcon name={nodeData.iconName || 'Zap'} className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
              {nodeData.label || 'Trigger Event'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
              {nodeData.description || 'Starts the workflow automation'}
            </div>
          </div>
        </div>

        {/* Configuration summary pill */}
        {nodeData.config?.triggerEvent && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span className="font-mono text-purple-600 dark:text-purple-400 truncate max-w-[170px]">
              {nodeData.config.triggerEvent}
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          </div>
        )}
      </div>

      {/* Source Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3.5 !h-3.5 !bg-purple-600 !border-2 !border-white dark:!border-slate-900 hover:!scale-125 !transition-transform !shadow-sm !-right-2"
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';
