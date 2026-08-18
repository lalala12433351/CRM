import React from 'react';
import { UserCheck, PhoneCall, Clock, Award, Shield, CheckCircle2 } from 'lucide-react';
import { Agent } from '../types';

interface TeamViewProps {
  agents: Agent[];
  onToggleAgentStatus: (agentId: string, status: Agent['status']) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ agents, onToggleAgentStatus }) => {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span>Telecalling Team Performance & Live Telemetry</span>
          </h1>
          <p className="text-xs text-slate-500">Monitor active telecallers, live call status, hourly call volume targets, and agent leaderboards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((ag) => (
          <div key={ag.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center space-x-3">
              <img src={ag.avatar} alt={ag.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/30" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">{ag.name}</h3>
                <p className="text-[11px] text-slate-500">{ag.role}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className={`w-2 h-2 rounded-full ${
                    ag.status === 'online' ? 'bg-emerald-500' : ag.status === 'on_call' ? 'bg-amber-500 animate-ping' : 'bg-slate-400'
                  }`} />
                  <span className="text-[10px] text-slate-700 capitalize font-medium">{ag.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Calls Logged:</span>
                <span className="font-bold text-slate-900">{ag.totalCallsToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Talk Time:</span>
                <span className="font-bold text-indigo-600">{ag.talkTimeMinutes} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Closed Deals:</span>
                <span className="font-bold text-emerald-600">{ag.convertedLeadsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Revenue:</span>
                <span className="font-extrabold text-emerald-600 font-mono">₹{(ag.revenueGenerated / 1000).toFixed(0)}k</span>
              </div>
            </div>

            {/* Status Change Selector */}
            <div className="flex items-center space-x-1 pt-1">
              {(['online', 'on_call', 'break', 'offline'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => onToggleAgentStatus(ag.id, st)}
                  className={`flex-1 py-1 rounded text-[9px] font-bold capitalize cursor-pointer border ${
                    ag.status === st ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
