import React, { useState } from 'react';
import {
  Shield,
  Check,
  Plus,
  Lock,
  CheckCircle2,
  Sliders,
  Users,
  Eye,
  Trash2,
  Download,
  PhoneCall,
  X
} from 'lucide-react';

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: Record<string, boolean>;
}

const INITIAL_ROLES: RoleDefinition[] = [
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Full unrestricted platform access, multi-tenant workspace administration and billing',
    usersCount: 2,
    permissions: {
      'view_all_leads': true,
      'export_leads': true,
      'delete_leads': true,
      'listen_call_recordings': true,
      'make_outbound_calls': true,
      'manage_team_users': true,
      'edit_system_settings': true,
      'access_raw_database': true,
    }
  },
  {
    id: 'sales-manager',
    name: 'Sales Manager',
    description: 'Manages sales counselors, reviews team quotas, call conversion metrics, and deals',
    usersCount: 3,
    permissions: {
      'view_all_leads': true,
      'export_leads': true,
      'delete_leads': false,
      'listen_call_recordings': true,
      'make_outbound_calls': true,
      'manage_team_users': true,
      'edit_system_settings': false,
      'access_raw_database': false,
    }
  },
  {
    id: 'senior-counselor',
    name: 'Senior Counselor',
    description: 'Handles high-ticket prospect negotiations, admissions closures, and pipeline moves',
    usersCount: 6,
    permissions: {
      'view_all_leads': false,
      'export_leads': false,
      'delete_leads': false,
      'listen_call_recordings': true,
      'make_outbound_calls': true,
      'manage_team_users': false,
      'edit_system_settings': false,
      'access_raw_database': false,
    }
  },
  {
    id: 'telecaller',
    name: 'Telecaller',
    description: 'Dedicated high-velocity outbound dialer, follow-ups, and initial qualification',
    usersCount: 14,
    permissions: {
      'view_all_leads': false,
      'export_leads': false,
      'delete_leads': false,
      'listen_call_recordings': false,
      'make_outbound_calls': true,
      'manage_team_users': false,
      'edit_system_settings': false,
      'access_raw_database': false,
    }
  }
];

const PERMISSION_LABELS: Record<string, { label: string; category: string }> = {
  'view_all_leads': { label: 'View All Workspace Leads', category: 'Leads & Data' },
  'export_leads': { label: 'Export Leads to CSV / Excel', category: 'Leads & Data' },
  'delete_leads': { label: 'Permanently Delete Leads', category: 'Leads & Data' },
  'listen_call_recordings': { label: 'Listen to Audio Call Recordings', category: 'Telecalling & Audio' },
  'make_outbound_calls': { label: 'Access Power Dialer & Calls', category: 'Telecalling & Audio' },
  'manage_team_users': { label: 'Invite & Manage Team Members', category: 'Administration' },
  'edit_system_settings': { label: 'Edit System Settings & Integrations', category: 'Administration' },
  'access_raw_database': { label: 'Direct Database Telemetry & Migration', category: 'Administration' },
};

export function RoleManagementView() {
  const [roles, setRoles] = useState<RoleDefinition[]>(INITIAL_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('sales-manager');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const activeRole = roles.find(r => r.id === selectedRoleId) || roles[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const togglePermission = (permKey: string) => {
    setRoles(roles.map(r => {
      if (r.id === activeRole.id) {
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [permKey]: !r.permissions[permKey]
          }
        };
      }
      return r;
    }));
  };

  const handleSavePermissions = () => {
    showToast(`Permissions saved for role: ${activeRole.name}`);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const newRole: RoleDefinition = {
      id: newRoleName.toLowerCase().replace(/\s+/g, '-'),
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || 'Custom organizational permission role',
      usersCount: 0,
      permissions: {
        'view_all_leads': true,
        'export_leads': false,
        'delete_leads': false,
        'listen_call_recordings': false,
        'make_outbound_calls': true,
        'manage_team_users': false,
        'edit_system_settings': false,
        'access_raw_database': false,
      }
    };

    setRoles([...roles, newRole]);
    setSelectedRoleId(newRole.id);
    setNewRoleName('');
    setNewRoleDesc('');
    setIsCreateRoleModalOpen(false);
    showToast(`Role "${newRole.name}" created!`);
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg flex items-center gap-2 border border-slate-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Role & Permission Management</h2>
          <p className="text-xs text-slate-500">Configure role-based access control (RBAC) and permissions</p>
        </div>

        <button
          onClick={() => setIsCreateRoleModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-slate-800 active:bg-slate-300 active:text-black transition-all cursor-pointer shadow-2xs self-start"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create Custom Role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Role Selection Cards */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase px-1">Available Roles</div>
          {roles.map((r) => {
            const isSelected = r.id === selectedRoleId;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50 active:bg-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{r.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {r.usersCount} Users
                  </span>
                </div>
                <p className={`text-[11px] mt-1.5 leading-relaxed line-clamp-2 ${
                  isSelected ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  {r.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Permission Matrix */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">{activeRole.name} Permissions</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Toggle authorized features for this role</p>
            </div>

            <button
              onClick={handleSavePermissions}
              className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-slate-800 active:bg-slate-300 active:text-black transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>

          {/* Permissions Grouped */}
          <div className="space-y-4">
            {['Leads & Data', 'Telecalling & Audio', 'Administration'].map((category) => {
              const categoryPerms = Object.entries(PERMISSION_LABELS).filter(
                ([_, meta]) => meta.category === category
              );

              return (
                <div key={category} className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {categoryPerms.map(([permKey, meta]) => {
                      const isGranted = !!activeRole.permissions[permKey];

                      return (
                        <div
                          key={permKey}
                          onClick={() => togglePermission(permKey)}
                          className="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <div className="text-xs text-slate-800 font-medium">
                            {meta.label}
                          </div>
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                            isGranted
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isGranted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">+ Create Custom Role</h3>
              <button onClick={() => setIsCreateRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regional Sales Director"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Role Scope & Purpose</label>
                <textarea
                  rows={3}
                  placeholder="Describe the permissions and department for this role..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-slate-800 active:bg-slate-300 active:text-black transition-all cursor-pointer"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
