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
  onUpdateAgent?: (updatedAgent: Agent) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  agents,
  activeAgent,
  onToggleAgentStatus,
  onAddAgent,
  onRemoveAgent,
  onToggleAdminPower,
  onUpdateAgentRole,
  onUpdateAgent
}) => {
  const isAdmin = isAgentAdmin(activeAgent);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleText, setEditRoleText] = useState('');

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('Telecaller & Course Counselor');
  const [newAvatar, setNewAvatar] = useState('');
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Edit User Modal State
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  const handleOpenEditUserModal = (agent: Agent) => {
    setEditingAgent(agent);
    setEditName(agent.name);
    setEditEmail(agent.email);
    setEditPhone(agent.phone.replace(/\D/g, '').slice(-10));
    setEditRole(agent.role);
    setEditAvatar(agent.avatar || '');
    setEditIsAdmin(isAgentAdmin(agent));
    setEditFormErrors({});
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    const trimmedName = newName.trim();
    const trimmedEmail = newEmail.trim();
    const cleanPhone = newPhone.replace(/\D/g, '');
    const trimmedRole = newRole.trim();

    if (!trimmedName || trimmedName.length < 2) {
      errs.name = 'Full Name must be at least 2 characters.';
    }

    if (!trimmedEmail) {
      errs.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Email must be a valid address containing "@" and domain (e.g. name@company.com).';
    }

    if (!cleanPhone) {
      errs.phone = 'Phone Number is required.';
    } else if (cleanPhone.length !== 10) {
      errs.phone = 'Phone number must contain at least 10 valid digits.';
    }

    if (!trimmedRole) {
      errs.role = 'Role title is required.';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormErrors({});

    const formattedPhone = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;

    const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    const newAgent: Agent = {
      id: `agent-${Date.now().toString().slice(-5)}`,
      name: trimmedName,
      email: trimmedEmail,
      phone: formattedPhone,
      role: trimmedRole,
      isAdmin: makeAdmin || trimmedRole.toLowerCase().includes('admin'),
      status: 'online',
      avatar: newAvatar || defaultAvatar,
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
    setNewAvatar('');
    setMakeAdmin(false);
    setFormErrors({});
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
            onClick={() => {
              setFormErrors({});
              setIsAddUserModalOpen(true);
            }}
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
          const isMasterOwner = ag.role === 'Master Admin' || ag.role === 'Owner';
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
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border border-slate-200 bg-slate-100 text-slate-700 shrink-0">
                    {agIsAdmin ? 'Admin' : 'Employee'}
                  </span>
                </div>

                {/* Role Customization */}
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
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-all cursor-pointer"
                          title="Edit Custom Role Title"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : isEditingRole ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={editRoleText}
                          onChange={(e) => setEditRoleText(e.target.value)}
                          className="px-2 py-0.5 rounded border border-indigo-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRoleEdit(ag.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-all cursor-pointer"
                          title="Save Role Title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-900 truncate max-w-[140px]">{ag.role}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                {/* Admin Status Toggle */}
                {isAdmin ? (
                  <button
                    onClick={() => !isMasterOwner && onToggleAdminPower && onToggleAdminPower(ag.id)}
                    disabled={isMasterOwner}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      agIsAdmin
                        ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isMasterOwner ? 'Master Account Admin' : agIsAdmin ? 'Click to Revoke Admin' : 'Click to Grant Admin'}
                  >
                    {agIsAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> : <Shield className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{agIsAdmin ? 'Admin Powers' : 'Grant Admin'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>{agIsAdmin ? 'System Admin' : 'Standard Agent'}</span>
                  </span>
                )}

                {/* Action Buttons: Edit User Details & Remove User */}
                {isAdmin && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditUserModal(ag)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                      title={`Edit ${ag.name}'s details`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {!isMasterOwner && (
                      <button
                        onClick={() => onRemoveAgent && onRemoveAgent(ag.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title={`Remove ${ag.name} from team`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Add New User Account */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in text-xs font-sans font-normal">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                <User className="w-5 h-5 text-indigo-600" />
                <span>Add New User Account</span>
              </h2>
              <button 
                onClick={() => {
                  setFormErrors({});
                  setIsAddUserModalOpen(false);
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3" noValidate>
              {/* Profile Image / Avatar Picker */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Profile Image / Avatar
                </label>
                <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                    {newAvatar ? (
                      <img src={newAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                    />
                    <input
                      type="url"
                      value={newAvatar.startsWith('data:') ? '' : newAvatar}
                      onChange={(e) => setNewAvatar(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:border-indigo-600 bg-white"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Anjali Kumar"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none font-normal ${
                    formErrors.name ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-indigo-600'
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-rose-600 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="e.g. anjali@company.com"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none font-normal ${
                    formErrors.email ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-indigo-600'
                  }`}
                />
                {formErrors.email && <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Phone Number (10 Digits) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-500 font-medium text-xs">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={newPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewPhone(val);
                      if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="9876543210"
                    className={`w-full pl-12 pr-3 py-2 rounded-xl border focus:outline-none font-normal font-mono ${
                      formErrors.phone ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-indigo-600'
                    }`}
                  />
                </div>
                {formErrors.phone ? (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Must be exactly 10 digits</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Custom Role Description / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRole}
                  onChange={(e) => {
                    setNewRole(e.target.value);
                    if (formErrors.role) setFormErrors((prev) => ({ ...prev, role: '' }));
                  }}
                  placeholder="e.g. Course Coordinator & Telecaller"
                  className={`w-full px-3 py-2 rounded-xl border bg-white focus:outline-none font-normal ${
                    formErrors.role ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-indigo-600'
                  }`}
                />
                {formErrors.role && <p className="text-[11px] text-rose-600 mt-1">{formErrors.role}</p>}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="grantAdminCheck"
                  checked={makeAdmin}
                  onChange={(e) => setMakeAdmin(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="grantAdminCheck" className="text-slate-700 font-medium cursor-pointer">
                  Grant Full Admin Control (User management, Integrations, Billing)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setFormErrors({});
                    setIsAddUserModalOpen(false);
                  }}
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

      {/* MODAL: Edit Existing User Account */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in text-xs font-sans font-normal">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>Edit User Account Details</span>
              </h2>
              <button 
                onClick={() => {
                  setEditingAgent(null);
                  setEditFormErrors({});
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const errs: Record<string, string> = {};
                const trimmedName = editName.trim();
                const trimmedEmail = editEmail.trim();
                const cleanPhone = editPhone.replace(/\D/g, '');
                const trimmedRole = editRole.trim();

                if (!trimmedName || trimmedName.length < 2) {
                  errs.name = 'Full Name must be at least 2 characters.';
                }

                if (!trimmedEmail) {
                  errs.email = 'Email Address is required.';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
                  errs.email = 'Email must be a valid address containing "@" and domain (e.g. name@company.com).';
                }

                if (!cleanPhone) {
                  errs.phone = 'Phone Number is required.';
                } else if (cleanPhone.length !== 10) {
                  errs.phone = 'Phone number must contain at least 10 valid digits.';
                }

                if (!trimmedRole) {
                  errs.role = 'Role title is required.';
                }

                if (Object.keys(errs).length > 0) {
                  setEditFormErrors(errs);
                  return;
                }

                const formattedPhone = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;

                const updatedAgent: Agent = {
                  ...editingAgent,
                  name: trimmedName,
                  email: trimmedEmail,
                  phone: formattedPhone,
                  role: trimmedRole,
                  avatar: editAvatar || editingAgent.avatar,
                  isAdmin: editIsAdmin,
                };

                if (onUpdateAgent) {
                  onUpdateAgent(updatedAgent);
                } else if (onUpdateAgentRole) {
                  onUpdateAgentRole(editingAgent.id, trimmedRole);
                }

                setEditingAgent(null);
                setEditFormErrors({});
              }} 
              className="space-y-3" 
              noValidate
            >
              {/* Avatar Image Picker */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Profile Image / Avatar
                </label>
                <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                    {editAvatar ? (
                      <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setEditAvatar(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                    />
                    <input
                      type="url"
                      value={editAvatar.startsWith('data:') ? '' : editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:border-indigo-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (editFormErrors.name) setEditFormErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none font-normal ${
                    editFormErrors.name ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-indigo-600'
                  }`}
                />
                {editFormErrors.name && <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.name}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => {
                    setEditEmail(e.target.value);
                    if (editFormErrors.email) setEditFormErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none font-normal ${
                    editFormErrors.email ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-indigo-600'
                  }`}
                />
                {editFormErrors.email && <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.email}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Phone Number (10 Digits) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-500 font-medium text-xs">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={editPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setEditPhone(val);
                      if (editFormErrors.phone) setEditFormErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    className={`w-full pl-12 pr-3 py-2 rounded-xl border focus:outline-none font-normal font-mono ${
                      editFormErrors.phone ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-indigo-600'
                    }`}
                  />
                </div>
                {editFormErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Custom Role Description / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editRole}
                  onChange={(e) => {
                    setEditRole(e.target.value);
                    if (editFormErrors.role) setEditFormErrors((prev) => ({ ...prev, role: '' }));
                  }}
                  className={`w-full px-3 py-2 rounded-xl border bg-white focus:outline-none font-normal ${
                    editFormErrors.role ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-indigo-600'
                  }`}
                />
                {editFormErrors.role && <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.role}</p>}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="editGrantAdminCheck"
                  checked={editIsAdmin}
                  onChange={(e) => setEditIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="editGrantAdminCheck" className="text-slate-700 font-medium cursor-pointer">
                  Grant Full Admin Control (User management, Integrations, Billing)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAgent(null);
                    setEditFormErrors({});
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
