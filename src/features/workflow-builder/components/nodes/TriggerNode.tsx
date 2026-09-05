import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { WorkflowNodeData } from '../../types/workflow.types';
import { CheckCircle2 } from 'lucide-react';

export const TriggerNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;

  return (
    <div
      className={`relative min-w-[270px] max-w-[300px] rounded-lg bg-white border font-sans transition-all duration-150 shadow-xs ${
        selected
          ? 'border-[#3a2088] ring-2 ring-[#3a2088]/20 shadow-md'
          : 'border-purple-200/90 hover:border-[#3a2088]'
      }`}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#3a2088] text-white rounded-t-lg">
        <div className="text-[11px] font-medium tracking-wider uppercase">
          <span>EVENT (TRIGGER)</span>
        </div>
      </div>

      {/* Node Body */}
      <div className="p-4">
        <div className="text-xs font-normal text-slate-800 truncate">
          {nodeData.label || 'Trigger Event'}
        </div>

        {/* Configuration summary pill */}
        {nodeData.config?.triggerEvent && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-normal">
            <span className="font-mono text-[#3a2088] truncate max-w-[170px]">
              {nodeData.config.triggerEvent}
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
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
        className="!w-4 !h-4 !bg-[#3a2088] !border-2 !border-white !rounded-full !cursor-crosshair hover:!scale-125 transition-transform !z-50 shadow-sm"
        style={{
          boxShadow: '0 0 0 1.5px #3a2088'
        }}
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';
