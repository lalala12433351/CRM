import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DynamicIcon } from '../DynamicIcon';
import { WorkflowNodeData } from '../../types/workflow.types';
import { CheckCircle2 } from 'lucide-react';

export const TriggerNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;

  return (
    <div
      className={`relative min-w-[260px] max-w-[290px] rounded-lg bg-white border transition-all duration-200 shadow-xs ${
        selected
          ? 'border-[#3a2088] ring-2 ring-[#3a2088]/20 shadow-md'
          : 'border-purple-200/90 hover:border-[#3a2088]'
      }`}
    >
      {/* Node Header (Solid Background, No Gradient, No Header Icon) */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#3a2088] text-white rounded-t-lg">
        <div className="text-[11px] font-bold tracking-wider uppercase">
          <span>EVENT (TRIGGER)</span>
        </div>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">
          Entry Point
        </span>
      </div>

      {/* Node Body */}
      <div className="p-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-purple-50 text-[#3a2088] border border-purple-200 shrink-0">
            <DynamicIcon name={nodeData.iconName || 'Zap'} className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {nodeData.label || 'Trigger Event'}
            </div>
          </div>
        </div>

        {/* Configuration summary pill */}
        {nodeData.config?.triggerEvent && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="font-mono text-[#3a2088] font-bold truncate max-w-[170px]">
              {nodeData.config.triggerEvent}
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
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
        isConnectable={true}
        className="!w-4 !h-4 !bg-[#3a2088] !border-2 !border-white hover:!scale-125 !transition-transform !shadow-sm !-right-2 z-50 cursor-crosshair"
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';

