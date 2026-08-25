import React, { useState } from 'react';
import { UserCheck, Shield, Plus, Trash2, ShieldCheck, ShieldAlert, X, User, Edit3, Check } from 'lucide-react';
import { Agent, isAgentAdmin } from '../types';

interface TeamViewProps {
  agents: Agent[];
  activeAgent: Agent;
  onToggleAgentStatus: (agentId: string, status: Agent['status']) => void;
  onAddAgent?: (newAgent: Agent) => void;
  onRemoveAgent?: (agentId: string) => void;
  onToggleAdminPower?: (agentId: string) => void;
  onUpdateAgentRole?: (agentId: string, newRole: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  agents,
  activeAgent,
  onToggleAgentStatus,
  onAddAgent,
  onRemoveAgent,
  onToggleAdminPower,
  onUpdateAgentRole
}) => {
  const isAdmin = isAgentAdmin(activeAgent);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleText, setEditRoleText] = useState('');

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('Telecaller & Course Counselor');
  const [makeAdmin, setMakeAdmin] = useState(false);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newAgent: Agent = {
      id: `agent-${Date.now().toString().slice(-5)}`,
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || '+91 90000 00000',
      role: newRole.trim() || 'Telecaller & Counselor',
      isAdmin: makeAdmin || newRole.toLowerCase().includes('admin'),
      status: 'online',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + (agents.length * 100)}?w=150&auto=format&fit=crop&q=80`,
      totalCallsToday: 0,
      talkTimeMinutes: 0,
      convertedLeadsCount: 0,
      revenueGenerated: 0,
      responseTimeMinutes: 1.0,
    };

    if (onAddAgent) {
      onAddAgent(newAgent);
    }

    setIsAddUserModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewRole('Telecaller & Course Counselor');
    setMakeAdmin(false);
  };

  const handleSaveRoleEdit = (agentId: string) => {
    if (onUpdateAgentRole && editRoleText.trim()) {
      onUpdateAgentRole(agentId, editRoleText.trim());
    }
    setEditingRoleId(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto text-slate-900 font-sans font-normal">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span>User Accounts & Team Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user roles, custom role descriptions, assign admin powers, add/remove team members, and monitor telecalling telemetry.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        )}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((ag) => {
          const agIsAdmin = isAgentAdmin(ag);
          const isMasterOwner = ag.email === 'madhava@kiteaviation.edu' || ag.id === 'agent-ms';
          const isEditingRole = editingRoleId === ag.id;

          return (
            <div key={ag.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 relative flex flex-col justify-between">
              <div>
                {/* Header Profile Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={ag.avatar} alt={ag.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0" />
                    <div className="truncate">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{ag.name}</h3>
                      <p className="text-[11px] text-slate-500 truncate">{ag.email}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className={`w-2 h-2 rounded-full ${
                          ag.status === 'online' ? 'bg-emerald-500' : ag.status === 'on_call' ? 'bg-amber-500 animate-ping' : 'bg-slate-400'
                        }`} />
                        <span className="text-[10px] text-slate-700 capitalize font-normal">{ag.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border shrink-0 ${
                    agIsAdmin 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    {agIsAdmin ? 'Admin' : 'Employee'}
                  </span>
                </div>

                {/* Telemetry & Role Customization */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Role Description:</span>
                    {isAdmin && !isEditingRole ? (
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-slate-900 truncate max-w-[140px]">{ag.role}</span>
                        <button
                          onClick={() => {
                            setEditingRoleId(ag.id);
                            setEditRoleText(ag.role);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                          title="Edit Custom Role Description"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : isEditingRole ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={editRoleText}
                          onChange={(e) => setEditRoleText(e.target.value)}
                          className="px-2 py-0.5 text-xs border border-indigo-300 rounded bg-white focus:outline-none w-32 font-normal"
                        />
                        <button
                          onClick={() => handleSaveRoleEdit(ag.id)}
                          className="p-1 bg-indigo-600 text-white rounded cursor-pointer hover:bg-indigo-700"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-medium text-slate-900 truncate max-w-[140px]">{ag.role}</span>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Calls Logged:</span>
                    <span className="font-semibold text-slate-900">{ag.totalCallsToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Talk Time:</span>
                    <span className="font-semibold text-indigo-600">{ag.talkTimeMinutes} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Closed Deals:</span>
                    <span className="font-semibold text-emerald-600">{ag.convertedLeadsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Revenue Generated:</span>
                    <span className="font-semibold text-emerald-600 font-sans">₹{(ag.revenueGenerated / 1000).toFixed(0)}k</span>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="flex items-center space-x-1 pt-3">
                  {(['online', 'on_call', 'break', 'offline'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => onToggleAgentStatus(ag.id, st)}
                      className={`flex-1 py-1 rounded text-[9px] font-medium capitalize cursor-pointer border ${
                        ag.status === st ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Management Actions */}
              {isAdmin && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!isMasterOwner ? (
                    <button
                      onClick={() => onToggleAdminPower && onToggleAdminPower(ag.id)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-medium flex items-center justify-center space-x-1 transition-all cursor-pointer border ${
                        agIsAdmin 
                          ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' 
                          : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                      }`}
                      title={agIsAdmin ? 'Revoke Admin Powers' : 'Grant Admin Powers'}
                    >
                      {agIsAdmin ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>{agIsAdmin ? 'Revoke Admin' : 'Grant Admin'}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-2">Master Account Owner</span>
                  )}

                  {!isMasterOwner && ag.id !== activeAgent.id && onRemoveAgent && (
                    <button
                      onClick={() => onRemoveAgent(ag.id)}
                      className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Remove User Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in text-xs font-sans font-normal">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                <User className="w-5 h-5 text-indigo-600" />
                <span>Add New User Account</span>
              </h2>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Anjali Kumar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 font-normal"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. anjali@kiteaviation.edu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 font-normal"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 font-normal"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Custom Role Description / Title</label>
                <input
                  type="text"
                  required
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Course Coordinator & Telecaller"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-600 font-normal"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="grantAdminCheck"
                  checked={makeAdmin}
                  onChange={(e) => setMakeAdmin(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="grantAdminCheck" className="text-slate-700 font-medium cursor-pointer">
                  Grant Full Admin Control (User management, Integrations, Billing)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
