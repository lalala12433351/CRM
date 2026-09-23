import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  Shield, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  User, 
  Edit3, 
  Check, 
  Layers, 
  Info, 
  ChevronLeft, 
  ChevronRight,
  Download,
  ShoppingCart,
  Users,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { Agent, isAgentAdmin } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { toast } from '../context/ToastContext';
import { EmptyState } from '../components/EmptyState';
import { formatProperName } from '../utils/formatUtils';

interface TeamViewProps {
  agents: Agent[];
  activeAgent: Agent;
  onToggleAgentStatus: (agentId: string, status: Agent['status']) => void;
  onAddAgent?: (
    newAgent: Agent
  ) => Promise<{ success: boolean; error?: string; field?: 'email' | 'phone' }>;
  onRemoveAgent?: (agentId: string) => void;
  onToggleAdminPower?: (agentId: string) => void;
  onUpdateAgentRole?: (agentId: string, newRole: string) => void;
  onUpdateAgent?: (updatedAgent: Agent) => void;
}

const getInitials = (name: string = '') => {
  const clean = name.trim();
  if (!clean) return 'US';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

export const TeamPage: React.FC<TeamViewProps> = ({
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
  const [isBuyLicensesModalOpen, setIsBuyLicensesModalOpen] = useState(false);
  const [licensesToBuy, setLicensesToBuy] = useState(1);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [selectedRoleFilters, setSelectedRoleFilters] = useState<string[]>([]);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newManagerId, setNewManagerId] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Manager' | 'Telecaller'>('Telecaller');
  const [newPermission, setNewPermission] = useState<'Admin' | 'Manager' | 'Telecaller'>('Telecaller');
  const [newAvatar, setNewAvatar] = useState('');
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Edit User Modal State
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editManagerId, setEditManagerId] = useState('');
  const [editRole, setEditRole] = useState<'Admin' | 'Manager' | 'Telecaller'>('Telecaller');
  const [editPermission, setEditPermission] = useState<'Admin' | 'Manager' | 'Telecaller'>('Telecaller');
  const [editAvatar, setEditAvatar] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const managers = useMemo(
    () => agents.filter((agent) => (agent.role || '').toLowerCase().includes('manager') && !isAgentAdmin(agent)),
    [agents]
  );

  // Role Filtering Logic
  const filteredAgents = useMemo(() => {
    if (selectedRoleFilters.length === 0) return agents;
    return agents.filter((ag) => {
      const r = (ag.role || 'Caller').toLowerCase();
      const p = (ag.permission || '').toLowerCase();
      const agAdmin = isAgentAdmin(ag);

      return selectedRoleFilters.some((filterKey) => {
        const fk = filterKey.toLowerCase();
        if (fk === 'root') return r.includes('root') || r.includes('owner') || p.includes('root');
        if (fk === 'admin') return agAdmin || p.includes('admin') || r.includes('admin');
        if (fk === 'manager') return r.includes('manager') || p.includes('manager');
        if (fk === 'caller') return r.includes('caller') || r.includes('telecaller') || p.includes('caller');
        if (fk === 'marketing user' || fk === 'marketing' || fk === 'marketer') return r.includes('market') || p.includes('market');
        return false;
      });
    });
  }, [agents, selectedRoleFilters]);

  const toggleRoleFilter = (roleKey: string) => {
    setSelectedRoleFilters((prev) =>
      prev.includes(roleKey) ? prev.filter((k) => k !== roleKey) : [...prev, roleKey]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAgentIds.length === filteredAgents.length) {
      setSelectedAgentIds([]);
    } else {
      setSelectedAgentIds(filteredAgents.map(a => a.id));
    }
  };

  const toggleSelectAgent = (id: string) => {
    setSelectedAgentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportUsers = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Permission', 'Status', 'Calls Today', 'Revenue Generated'];
    const rows = filteredAgents.map(a => [
      `"${a.id}"`,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.email.replace(/"/g, '""')}"`,
      `"${a.phone.replace(/"/g, '""')}"`,
      `"${a.role.replace(/"/g, '""')}"`,
      `"${(a.permission || '').replace(/"/g, '""')}"`,
      `"${a.status}"`,
      a.totalCallsToday || 0,
      a.revenueGenerated || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crm_users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEditUserModal = (agent: Agent) => {
    setEditingAgent(agent);
    setEditName(agent.name);
    setEditEmail(agent.email);
    setEditPhone(agent.phone.replace(/\D/g, '').slice(-10));
    setEditPassword('');
    setEditManagerId(agent.managerId || '');
    
    // Normalize to Admin | Manager | Telecaller
    let initialRole: 'Admin' | 'Manager' | 'Telecaller' = 'Telecaller';
    const rLower = (agent.role || '').toLowerCase();
    if (isAgentAdmin(agent) || rLower.includes('admin') || rLower.includes('owner')) initialRole = 'Admin';
    else if (rLower.includes('manager')) initialRole = 'Manager';
    else initialRole = 'Telecaller';
    setEditRole(initialRole);

    let initialPerm: 'Admin' | 'Manager' | 'Telecaller' = initialRole;
    const pLower = (agent.permission || '').toLowerCase();
    if (isAgentAdmin(agent) || pLower.includes('admin') || pLower.includes('root')) {
      initialPerm = 'Admin';
    } else if (pLower.includes('manager') || initialRole === 'Manager') {
      initialPerm = 'Manager';
    } else {
      initialPerm = 'Telecaller';
    }

    setEditPermission(initialPerm);
    setEditAvatar(agent.avatar || '');
    setEditIsAdmin(initialPerm === 'Admin' || isAgentAdmin(agent));
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    const trimmedName = newName.trim();
    const trimmedEmail = newEmail.trim();
    const cleanPhone = newPhone.replace(/\D/g, '');

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
    if (newPassword.length < 8) {
      errs.password = 'Temporary password must contain at least 8 characters.';
    }
    if (newRole === 'Telecaller' && !newManagerId) {
      errs.managerId = 'Select the manager responsible for this telecaller.';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormErrors({});

    const formattedPhone = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;

    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      phone: formattedPhone,
      role: newRole,
      permission: newPermission,
      companyName: activeAgent?.companyName || 'Pixbe Organization',
      isAdmin: newPermission === 'Admin' || newRole === 'Admin' || makeAdmin,
      status: 'online',
      avatar: newAvatar || '',
      totalCallsToday: 0,
      talkTimeMinutes: 0,
      convertedLeadsCount: 0,
      revenueGenerated: 0,
      responseTimeMinutes: 1.0,
      managerId: newRole === 'Telecaller' ? newManagerId : undefined,
      password: newPassword,
    };

    if (onAddAgent) {
      setIsCreatingUser(true);
      const result = await onAddAgent(newAgent).finally(() => setIsCreatingUser(false));
      if (!result.success) {
        setFormErrors((previous) => ({
          ...previous,
          ...(result.field ? { [result.field]: result.error || 'This value is already in use.' } : {}),
          ...(!result.field ? { submit: result.error || 'Unable to create this user. Please try again.' } : {})
        }));
        return;
      }
    }

    setIsAddUserModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewPassword('');
    setNewManagerId('');
    setNewRole('Telecaller');
    setNewPermission('Telecaller');
    setNewAvatar('');
    setMakeAdmin(false);
    setFormErrors({});
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto text-slate-900 font-sans font-normal">
      {/* 1. Page Heading: User Management */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>User Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization members, assign roles, licenses, and configure permissions.
          </p>
        </div>
      </div>

      {/* 2. Top Pagination & License Header Bar with Export, Buy Licenses, Add User */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-2xs font-sans text-xs">
        <div className="flex items-center space-x-3 text-slate-600 font-medium">
          <span>{filteredAgents.length > 0 ? `1 - ${filteredAgents.length} of ${filteredAgents.length}` : '0 of 0'}</span>
          <div className="flex items-center space-x-1 text-slate-400">
            <button
              type="button"
              className="w-5 h-5 rounded flex items-center justify-center hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              disabled
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="w-5 h-5 rounded flex items-center justify-center hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              disabled
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-semibold text-xs shadow-2xs">
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>1 License Available</span>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportUsers}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
            title="Export users list to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export</span>
          </button>

          {/* Buy Licenses Button */}
          {isAdmin && (
            <button
              onClick={() => setIsBuyLicensesModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
              title="Purchase additional user licenses"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-slate-600" />
              <span>Buy Licenses</span>
            </button>
          )}

          {/* Add User Button */}
          {isAdmin && (
            <button
              onClick={() => {
                setFormErrors({});
                setIsAddUserModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>

      {/* Users Data Table matching Screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden font-sans">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-white text-slate-500 font-medium text-[11px]">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedAgentIds.length === filteredAgents.length && filteredAgents.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 font-medium text-slate-600">Name</th>

                {/* ROLE COLUMN WITH FILTER DROPDOWN MATCHING SCREENSHOT */}
                <th className="py-3.5 px-4 font-medium text-slate-600 relative">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className="flex items-center space-x-1.5 text-slate-600 hover:text-indigo-600 font-medium cursor-pointer select-none"
                    >
                      <div className="w-px h-3.5 bg-slate-200 mr-1" />
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Role</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} />
                    </button>

                    {/* Role Filter Dropdown Popover */}
                    {isRoleDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsRoleDropdownOpen(false)} 
                        />
                        <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 space-y-0.5 font-sans">
                          {[
                            { key: 'Admin', label: 'Admin', icon: <Users className="w-3.5 h-3.5 text-slate-700" /> },
                            { key: 'Manager', label: 'Manager', icon: <User className="w-3.5 h-3.5 text-slate-800" /> },
                            { key: 'Caller', label: 'Telecaller', icon: <User className="w-3.5 h-3.5 text-slate-600" /> },
                          ].map((item) => {
                            const isChecked = selectedRoleFilters.includes(item.key);
                            return (
                              <div
                                key={item.key}
                                onClick={() => toggleRoleFilter(item.key)}
                                className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl cursor-pointer transition-colors select-none text-xs ${
                                  isChecked ? 'bg-indigo-50/70 text-indigo-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {item.icon}
                                  <span>{item.label}</span>
                                </div>
                              </div>
                            );
                          })}

                          {selectedRoleFilters.length > 0 && (
                            <div className="pt-1 mt-1 border-t border-slate-100 px-2 py-1 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">{selectedRoleFilters.length} selected</span>
                              <button
                                type="button"
                                onClick={() => setSelectedRoleFilters([])}
                                className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                              >
                                Clear all
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </th>

                <th className="py-3.5 px-4 font-medium text-slate-600">Reporting Manager</th>
                <th className="py-3.5 px-4 font-medium text-slate-600">Permission Template</th>
                <th className="py-3.5 px-4 font-medium text-slate-600">2FA</th>
                <th className="py-3.5 px-4 font-medium text-slate-600">License Expiry</th>
                <th className="py-3.5 px-4 font-medium text-slate-600">License Type</th>
                <th className="py-3.5 px-4 font-medium text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4">
                    <EmptyState
                      title="No Team Members Found"
                      description="No users or agents match your search filter. Click below to add a new team member."
                      actionLabel="Add Member"
                      onAction={() => setIsAddUserModalOpen(true)}
                      compact
                    />
                  </td>
                </tr>
              ) : (
                filteredAgents.map((ag) => {
                  const isSelected = selectedAgentIds.includes(ag.id);
                  const agIsAdmin = isAgentAdmin(ag);
                  const isMasterOwner = ag.isAdmin || ag.role === 'Admin' || ag.role === 'Owner';
                  
                  // Directly display the actual stored database role
                  const roleDisplay = agIsAdmin ? 'Admin' : (ag.role === 'Caller' ? 'Telecaller' : (ag.role || 'Telecaller'));
                  const normalizedRole = roleDisplay === 'Super Admin' || roleDisplay === 'Master Admin' || roleDisplay === 'Root' ? 'Admin' : roleDisplay;
                  const reportingManager = ag.managerId ? agents.find((manager) => manager.id === ag.managerId) : undefined;

                  // Format permission nicely (Admin, Manager, Marketer, Caller)
                  let permDisplay = ag.permission;
                  if (!permDisplay) {
                    if (agIsAdmin) permDisplay = 'Admin';
                    else if (roleDisplay === 'Manager') permDisplay = 'Manager';
                    else if (roleDisplay === 'Marketing') permDisplay = 'Marketer';
                    else permDisplay = 'Caller';
                  }

                  const permissionTemplateDisplay = `Default ${permDisplay} Permissions`;

                  return (
                    <tr
                      key={ag.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectAgent(ag.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <UserAvatar name={formatProperName(ag.name)} avatarUrl={ag.avatar} size="md" rounded="full" />
                          <div>
                            <p className="font-medium text-slate-900 text-xs sm:text-sm">{formatProperName(ag.name)}</p>
                            <a 
                              href={`mailto:${ag.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-slate-500 font-normal hover:text-indigo-600 hover:underline transition-colors"
                            >
                              {ag.email}
                            </a>
                          </div>
                        </div>
                      </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 text-slate-800 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-700" />
                        <span>{(normalizedRole === 'Super Admin' || normalizedRole === 'Master Admin' || normalizedRole === 'Root') ? 'Admin' : normalizedRole}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {reportingManager?.name || ((roleDisplay === 'Caller' || roleDisplay === 'Telecaller') ? 'Unassigned' : '—')}
                    </td>

                    {/* Permission Template */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                      <span>{permissionTemplateDisplay}</span>
                    </td>

                    {/* 2FA */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Shield className="w-4 h-4 text-rose-500 fill-rose-50" />
                    </td>

                    {/* License Expiry */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-medium">
                        14 Nov 2026
                      </span>
                    </td>

                    {/* License Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                          <Layers className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-slate-800 font-medium text-xs">
                          Core CRM
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        {isAdmin && (
                          <button
                            onClick={() => handleOpenEditUserModal(ag)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title={`Edit ${ag.name}'s details`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && !isMasterOwner && (
                          <button
                            onClick={() => onRemoveAgent && onRemoveAgent(ag.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title={`Remove ${ag.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add New User Account */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 font-sans">
          <div className="bg-white rounded-3xl border border-white/80 shadow-[0_24px_80px_-20px_rgba(15,23,42,0.45)] max-w-3xl w-full animate-in fade-in zoom-in-95 text-sm font-sans font-normal max-h-[92vh] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 sm:px-7 py-5 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Add New User Account</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Create a profile and configure access for your team member.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setFormErrors({});
                  setIsAddUserModalOpen(false);
                }} 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer transition-colors"
                aria-label="Close add user dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="min-h-0 flex flex-col" noValidate aria-busy={isCreatingUser}>
              <div className="overflow-y-auto px-5 sm:px-7 py-5 space-y-5">
              {/* Profile Image / Avatar Picker */}
              <div>
                <label className="block text-slate-700 font-semibold mb-2">
                  Profile Image / Avatar
                </label>
                <div className="flex items-center gap-4 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                    {newAvatar ? (
                      <img src={newAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                    />
                    <input
                      type="url"
                      value={newAvatar.startsWith('data:') ? '' : newAvatar}
                      onChange={(e) => setNewAvatar(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-3 focus:ring-indigo-100 focus:border-indigo-500 bg-white transition-shadow"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Account details</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Enter the user&apos;s contact information and login credentials.</p>
                </div>
                <p className="text-[11px] text-slate-400">Email and phone must be unique across the CRM.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
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
                  placeholder="e.g. Akhitha Rameshan"
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-3 font-normal transition-shadow ${
                    formErrors.name ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-rose-600 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
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
                  placeholder="e.g. akhitha@company.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-3 font-normal transition-shadow ${
                    formErrors.email ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {formErrors.email && <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Temporary Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="At least 8 characters"
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-3 transition-shadow ${formErrors.password ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'}`}
                />
                {formErrors.password && <p className="text-[11px] text-rose-600 mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Phone Number (10 Digits) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-500 font-semibold text-xs border-r border-slate-200 pr-3">+91</span>
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
                    className={`w-full pl-16 pr-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-3 font-normal font-mono transition-shadow ${
                      formErrors.phone ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                </div>
                {formErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>}
              </div>

              {/* 3 ROLE DROPDOWN: Admin, Manager, Telecaller */}
              <div className={newRole === 'Telecaller' ? '' : 'md:col-span-2'}>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Assignee Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => {
                    const r = e.target.value as 'Admin' | 'Manager' | 'Telecaller';
                    setNewRole(r);
                    setNewPermission(r);
                    setMakeAdmin(r === 'Admin');
                    if (r !== 'Telecaller') setNewManagerId('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-100 focus:border-indigo-500 font-medium text-sm text-slate-900 cursor-pointer transition-all shadow-2xs"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Telecaller">Telecaller</option>
                </select>
              </div>

              {newRole === 'Telecaller' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Reporting Manager <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newManagerId}
                    onChange={(e) => {
                      setNewManagerId(e.target.value);
                      if (formErrors.managerId) setFormErrors((prev) => ({ ...prev, managerId: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-3 text-sm transition-shadow ${formErrors.managerId ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'}`}
                  >
                    <option value="">Select a manager</option>
                    {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
                  </select>
                  {formErrors.managerId && <p className="text-[11px] text-rose-600 mt-1">{formErrors.managerId}</p>}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Leads assigned to this telecaller will appear in the selected manager&apos;s queue.
                  </p>
                </div>
              )}

              {/* PERMISSIONS AREA: Admin, Manager, Telecaller */}
              <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200 space-y-2.5">
                <label className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Permissions & Access Control <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newPermission}
                  onChange={(e) => {
                    const p = e.target.value as 'Admin' | 'Manager' | 'Telecaller';
                    setNewPermission(p);
                    setMakeAdmin(p === 'Admin');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-3 focus:ring-indigo-100 focus:border-indigo-500 font-semibold text-xs text-slate-900 cursor-pointer shadow-2xs"
                >
                  <option value="Admin">Admin (Full Control - Users, Integrations, Billing, System Config)</option>
                  <option value="Manager">Manager (Team Leads, Reports, Pipeline — no settings/automations/integrations)</option>
                  <option value="Telecaller">Telecaller (Dialer, Follow-ups, Assigned Leads Only)</option>
                </select>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Decides feature access and view permissions granted to this assignee in the CRM.
                </p>
              </div>
              {formErrors.submit && (
                <div className="md:col-span-2 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formErrors.submit}</span>
                </div>
              )}
              </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-5 sm:px-7 py-4 border-t border-slate-100 bg-white shadow-[0_-8px_24px_-20px_rgba(15,23,42,0.45)]">
                <button
                  type="button"
                  disabled={isCreatingUser}
                  onClick={() => {
                    setFormErrors({});
                    setIsAddUserModalOpen(false);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="min-w-40 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
                >
                  {isCreatingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking & creating...
                    </>
                  ) : (
                    'Create User Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Existing User Account */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in text-xs font-sans font-normal max-h-[90vh] overflow-y-auto">
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
                if (editPassword && editPassword.length < 8) {
                  errs.password = 'New password must contain at least 8 characters.';
                }
                if (editRole === 'Telecaller' && !editManagerId) {
                  errs.managerId = 'Select the manager responsible for this telecaller.';
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
                  role: editRole,
                  permission: editPermission,
                  avatar: editAvatar || editingAgent.avatar,
                  isAdmin: editPermission === 'Admin' || editRole === 'Admin',
                  managerId: editRole === 'Telecaller' ? editManagerId : undefined,
                  ...(editPassword ? { password: editPassword } : {}),
                };

                if (onUpdateAgent) {
                  onUpdateAgent(updatedAgent);
                } else if (onUpdateAgentRole) {
                  onUpdateAgentRole(editingAgent.id, editRole);
                }

                setEditingAgent(null);
                setEditFormErrors({});
              }} 
              className="space-y-3.5" 
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
                <label className="block text-slate-700 font-medium mb-1">Reset Password</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => {
                    setEditPassword(e.target.value);
                    if (editFormErrors.password) setEditFormErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="Leave blank to keep current password"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${editFormErrors.password ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 focus:border-indigo-600'}`}
                />
                {editFormErrors.password && <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.password}</p>}
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

              {/* 3 ROLE DROPDOWN: Admin, Manager, Telecaller */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Assignee Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editRole}
                  onChange={(e) => {
                    const r = e.target.value as 'Admin' | 'Manager' | 'Telecaller';
                    setEditRole(r);
                    setEditPermission(r);
                    setEditIsAdmin(r === 'Admin');
                    if (r !== 'Telecaller') setEditManagerId('');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:border-indigo-600 font-medium text-xs text-slate-900 cursor-pointer transition-all shadow-2xs"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Telecaller">Telecaller</option>
                </select>
              </div>

              {editRole === 'Telecaller' && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Reporting Manager <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editManagerId}
                    onChange={(e) => {
                      setEditManagerId(e.target.value);
                      if (editFormErrors.managerId) setEditFormErrors((prev) => ({ ...prev, managerId: '' }));
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border bg-white focus:outline-none ${editFormErrors.managerId ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-600'}`}
                  >
                    <option value="">Select a manager</option>
                    {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
                  </select>
                  {editFormErrors.managerId && <p className="text-[11px] text-rose-600 mt-1">{editFormErrors.managerId}</p>}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Leads assigned to this telecaller will appear in the selected manager&apos;s queue.
                  </p>
                </div>
              )}

              {/* PERMISSIONS AREA: Admin, Manager, Telecaller */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-slate-900 font-bold text-xs">
                  Permissions & Access Control <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editPermission}
                  onChange={(e) => {
                    const p = e.target.value as 'Admin' | 'Manager' | 'Telecaller';
                    setEditPermission(p);
                    setEditIsAdmin(p === 'Admin');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-600 font-semibold text-xs text-slate-900 cursor-pointer shadow-2xs"
                >
                  <option value="Admin">Admin (Full Control - Users, Integrations, Billing, System Config)</option>
                  <option value="Manager">Manager (Team Leads, Reports, Pipeline — no settings/automations/integrations)</option>
                  <option value="Telecaller">Telecaller (Dialer, Follow-ups, Assigned Leads Only)</option>
                </select>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Decides feature access and view permissions granted to this assignee in the CRM.
                </p>
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

      {/* MODAL: Buy Additional User Licenses */}
      {isBuyLicensesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in text-xs font-sans font-normal">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-slate-800" />
                <span>Buy User Licenses</span>
              </h2>
              <button 
                onClick={() => setIsBuyLicensesModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-xs font-bold text-slate-900">Core CRM Seat License</p>
                <p className="text-[11px] text-slate-700">₹999 / user / month (Billed monthly/annually)</p>
                <p className="text-[10px] text-slate-500">Includes Full Telephony Dialer, Role-based Access, and Unlimited Cloud Sync.</p>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">
                  Number of Additional Licenses:
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 5, 10].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setLicensesToBuy(qty)}
                      className={`px-3 py-2 rounded-xl font-bold text-xs cursor-pointer border transition-all ${
                        licensesToBuy === qty
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      +{qty} Seat{qty > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Estimated Total:</p>
                  <p className="text-base font-bold text-slate-900">₹{(licensesToBuy * 999).toLocaleString('en-IN')}</p>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Instant Activation
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBuyLicensesModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Purchase initiated for ${licensesToBuy} Core CRM license(s)! Your account will be upgraded immediately.`, 'License Checkout');
                    setIsBuyLicensesModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export const TeamView = TeamPage;
export default TeamPage;
