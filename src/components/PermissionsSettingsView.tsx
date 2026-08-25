import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  RotateCcw, 
  X, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Users, 
  Phone, 
  TrendingUp, 
  Bot, 
  Link2, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  Kanban, 
  SlidersHorizontal,
  Mail,
  Zap,
  CheckCircle2,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { PermissionTemplate, PermissionRights, Agent } from '../types';

interface PermissionsSettingsViewProps {
  permissionTemplates: PermissionTemplate[];
  onUpdateTemplates: (templates: PermissionTemplate[]) => void;
  agents: Agent[];
  onUpdateAgents?: (agents: Agent[]) => void;
  onShowToast?: (msg: string) => void;
}

export const PermissionsSettingsView: React.FC<PermissionsSettingsViewProps> = ({
  permissionTemplates,
  onUpdateTemplates,
  agents,
  onUpdateAgents,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'defaults'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeEditorCategory, setActiveEditorCategory] = useState<string>('assignee');
  const [accessExpanded, setAccessExpanded] = useState(true);
  const [viewExpanded, setViewExpanded] = useState(true);
  const [templatesExpanded, setTemplatesExpanded] = useState(true);

  // Filter templates
  const filteredTemplates = permissionTemplates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeSubTab === 'all' ? true : t.isDefault;
    return matchesSearch && matchesTab;
  });

  const handleOpenEditor = (template: PermissionTemplate) => {
    setEditingTemplate(JSON.parse(JSON.stringify(template)));
    setActiveEditorCategory('assignee');
    setIsEditorOpen(true);
  };

  const handleCreateNewTemplate = () => {
    const newTemp: PermissionTemplate = {
      id: `perm-${Date.now()}`,
      name: 'Custom Permission Template',
      description: 'Custom security rights template',
      isDefault: false,
      assignedCount: 0,
      assignedAgents: [],
      lastModifiedOn: 'Just now',
      createdOn: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }),
      createdBy: 'Admin',
      lastModifiedBy: 'FC',
      rights: {
        leads: true,
        salesform: true,
        team: false,
        permissions: false,
        calling: true,
        reports: true,
        automations: false,
        tasks: true,
        billings: false,
        integrations: false,
        aiAgents: true,
        leadView: true,
        dashboardView: true,
        leadsTableView: true,
        whatsappTemplates: true,
        smsTemplates: true,
        emailTemplates: true,
        embeddedApps: true,
      }
    };
    setEditingTemplate(newTemp);
    setActiveEditorCategory('assignee');
    setIsEditorOpen(true);
  };

  const handleSaveEditingTemplate = () => {
    if (!editingTemplate) return;
    const exists = permissionTemplates.some(t => t.id === editingTemplate.id);
    let updated: PermissionTemplate[];
    if (exists) {
      updated = permissionTemplates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
    } else {
      updated = [editingTemplate, ...permissionTemplates];
    }
    onUpdateTemplates(updated);

    // Update agents' permissionTemplateId if attached
    if (onUpdateAgents) {
      const updatedAgents = agents.map(ag => {
        if (editingTemplate.assignedAgents.includes(ag.id)) {
          return { ...ag, permissionTemplateId: editingTemplate.id };
        }
        if (ag.permissionTemplateId === editingTemplate.id && !editingTemplate.assignedAgents.includes(ag.id)) {
          return { ...ag, permissionTemplateId: undefined };
        }
        return ag;
      });
      onUpdateAgents(updatedAgents);
    }

    if (onShowToast) onShowToast(`Permission Template "${editingTemplate.name}" saved!`);
    setIsEditorOpen(false);
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete permission template "${name}"?`)) {
      const updated = permissionTemplates.filter(t => t.id !== id);
      onUpdateTemplates(updated);
      if (onShowToast) onShowToast(`Template "${name}" deleted.`);
    }
  };

  const handleToggleRight = (key: keyof PermissionRights) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      rights: {
        ...editingTemplate.rights,
        [key]: !editingTemplate.rights[key]
      }
    });
  };

  const handleToggleAgentAssignment = (agentId: string) => {
    if (!editingTemplate) return;
    const isAssigned = editingTemplate.assignedAgents.includes(agentId);
    const newAgents = isAssigned 
      ? editingTemplate.assignedAgents.filter(id => id !== agentId)
      : [...editingTemplate.assignedAgents, agentId];
    
    setEditingTemplate({
      ...editingTemplate,
      assignedAgents: newAgents,
      assignedCount: newAgents.length
    });
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-16">
      
      {/* SCREENSHOT 1: MAIN PERMISSION TEMPLATES LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
        
        {/* Header & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Permission Templates</h2>
              <button 
                onClick={() => { if (onShowToast) onShowToast('Refreshed permission templates'); }}
                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Refresh Permission Templates"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            onClick={handleCreateNewTemplate}
            className="px-4 py-2 rounded-xl bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm shadow-indigo-900/15 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add new</span>
          </button>
        </div>

        {/* Tabs: All | Defaults */}
        <div className="flex items-center space-x-6 border-b border-slate-200/80 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeSubTab === 'all' ? 'text-indigo-700 font-bold border-b-2 border-indigo-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveSubTab('defaults')}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeSubTab === 'defaults' ? 'text-indigo-700 font-bold border-b-2 border-indigo-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Defaults
          </button>
        </div>

        {/* Search Bar & Count */}
        <div className="space-y-2">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
            />
          </div>
          <p className="text-[11px] text-slate-400 font-medium">{filteredTemplates.length} templates found</p>
        </div>

        {/* Table View (Matching Screenshot 1) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium text-center">Assigned to</th>
                <th className="px-4 py-3 font-medium text-center">Last modified on</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No permission templates found.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="font-semibold text-slate-900">{template.name}</span>
                        {template.isDefault && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                            System
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Assigned to */}
                    <td className="px-4 py-3 text-center font-semibold text-slate-800">
                      {template.assignedCount}
                    </td>

                    {/* Last modified on */}
                    <td className="px-4 py-3 text-center text-slate-500 text-[11px]">
                      {template.lastModifiedOn}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditor(template)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title={template.isRoot ? "View Permissions" : "Edit Permissions"}
                        >
                          {template.isRoot ? <Eye className="w-4 h-4 text-slate-500" /> : <Edit3 className="w-4 h-4" />}
                        </button>

                        {!template.isRoot && (
                          <button
                            onClick={() => handleDeleteTemplate(template.id, template.name)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Template"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCREENSHOT 2 & 3: PERMISSION TEMPLATE EDITOR OVERLAY DRAWER / MODAL */}
      {isEditorOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-sans animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Top Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer shadow-2xs"
                >
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      className="text-base font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none px-1"
                    />
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-500">Granular Role & Feature Access Management</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                <div className="hidden md:block text-right">
                  <p>Created On: <span className="text-slate-600 font-semibold">{editingTemplate.createdOn || '13 May 26'}</span></p>
                  <p>Last Modified On: <span className="text-slate-600 font-semibold">{editingTemplate.lastModifiedOn || '22 May 26'}</span></p>
                </div>

                <button
                  onClick={handleSaveEditingTemplate}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Modal Body: 2-Column Split (Left Menu & Right Content) */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* LEFT CATEGORIES MENU (Exact Match to Screenshot 2 & 3) */}
              <div className="w-56 bg-slate-50/90 border-r border-slate-200 overflow-y-auto p-2 space-y-1 shrink-0 text-xs text-slate-700 font-medium">
                
                {/* 1. Assignee */}
                <button
                  onClick={() => setActiveEditorCategory('assignee')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition-colors ${
                    activeEditorCategory === 'assignee' ? 'bg-white text-indigo-900 font-bold border border-slate-200 shadow-2xs' : 'hover:bg-slate-100'
                  }`}
                >
                  <span>Assignee</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* 2. Access (Expandable) */}
                <div>
                  <button
                    onClick={() => setAccessExpanded(!accessExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-900 font-bold text-xs cursor-pointer hover:bg-slate-100 rounded-xl"
                  >
                    <span>Access</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${accessExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {accessExpanded && (
                    <div className="pl-3 space-y-0.5 border-l-2 border-slate-200 ml-3 pt-0.5">
                      {[
                        { id: 'access_leads', label: 'Leads', key: 'leads' },
                        { id: 'access_salesform', label: 'Salesform', key: 'salesform' },
                        { id: 'access_team', label: 'Team', key: 'team' },
                        { id: 'access_permissions', label: 'Permissions', key: 'permissions' },
                        { id: 'access_calling', label: 'Calling', key: 'calling' },
                        { id: 'access_reports', label: 'Reports', key: 'reports' },
                        { id: 'access_automations', label: 'Automations', key: 'automations' },
                        { id: 'access_tasks', label: 'Tasks', key: 'tasks' },
                        { id: 'access_billings', label: 'Billings', key: 'billings' },
                        { id: 'access_integrations', label: 'Integrations', key: 'integrations' },
                        { id: 'access_ai_agents', label: 'AI Agents', key: 'aiAgents' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveEditorCategory(item.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer flex items-center justify-between ${
                            activeEditorCategory === item.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className={`w-2 h-2 rounded-full ${editingTemplate.rights[item.key as keyof PermissionRights] ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. View (Expandable) */}
                <div>
                  <button
                    onClick={() => setViewExpanded(!viewExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-900 font-bold text-xs cursor-pointer hover:bg-slate-100 rounded-xl"
                  >
                    <span>View</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${viewExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {viewExpanded && (
                    <div className="pl-3 space-y-0.5 border-l-2 border-slate-200 ml-3 pt-0.5">
                      {[
                        { id: 'view_lead', label: 'Lead', key: 'leadView' },
                        { id: 'view_dashboard', label: 'Dashboard', key: 'dashboardView' },
                        { id: 'view_leads_table', label: 'Leads Table', key: 'leadsTableView' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveEditorCategory(item.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer flex items-center justify-between ${
                            activeEditorCategory === item.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className={`w-2 h-2 rounded-full ${editingTemplate.rights[item.key as keyof PermissionRights] ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Templates (Expandable) */}
                <div>
                  <button
                    onClick={() => setTemplatesExpanded(!templatesExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-900 font-bold text-xs cursor-pointer hover:bg-slate-100 rounded-xl"
                  >
                    <span>Templates</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${templatesExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {templatesExpanded && (
                    <div className="pl-3 space-y-0.5 border-l-2 border-slate-200 ml-3 pt-0.5">
                      {[
                        { id: 'tmpl_whatsapp', label: 'Whatsapp', key: 'whatsappTemplates' },
                        { id: 'tmpl_sms', label: 'Sms', key: 'smsTemplates' },
                        { id: 'tmpl_email', label: 'Email', key: 'emailTemplates' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveEditorCategory(item.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer flex items-center justify-between ${
                            activeEditorCategory === item.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className={`w-2 h-2 rounded-full ${editingTemplate.rights[item.key as keyof PermissionRights] ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Embedded Apps */}
                <button
                  onClick={() => setActiveEditorCategory('embedded_apps')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition-colors ${
                    activeEditorCategory === 'embedded_apps' ? 'bg-white text-indigo-900 font-bold border border-slate-200 shadow-2xs' : 'hover:bg-slate-100'
                  }`}
                >
                  <span>Embedded Apps</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* RIGHT CONTENT MAIN PANE (Matching Screenshot 2 & 3) */}
              <div className="flex-1 bg-white overflow-y-auto p-4 sm:p-6 space-y-4">
                
                {/* 1. ASSIGNEES PANE (Exact match to Screenshot 2) */}
                {activeEditorCategory === 'assignee' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Assignees</h3>
                    
                    {/* Search Field */}
                    <div className="relative max-w-sm">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    {/* Table of Assigned Users (Screenshot 2) */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Attach</th>
                            <th className="px-4 py-2.5">Name</th>
                            <th className="px-4 py-2.5">Email</th>
                            <th className="px-4 py-2.5">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {agents.map((agent) => {
                            const isAssigned = editingTemplate.assignedAgents.includes(agent.id);
                            return (
                              <tr key={agent.id} className="hover:bg-slate-50/80">
                                <td className="px-4 py-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onChange={() => handleToggleAgentAssignment(agent.id)}
                                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                                  />
                                </td>
                                <td className="px-4 py-2.5 font-medium text-slate-900">{agent.name}</td>
                                <td className="px-4 py-2.5 text-slate-500">{agent.email}</td>
                                <td className="px-4 py-2.5 text-slate-700 font-semibold">{agent.role || 'Caller'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. ACCESS & VIEW PERMISSION TOGGLE PANES */}
                {activeEditorCategory.startsWith('access_') || activeEditorCategory.startsWith('view_') ? (() => {
                  const categoryMap: Record<string, { title: string; key: keyof PermissionRights; desc: string }> = {
                    access_leads: { title: 'Leads Access & Management', key: 'leads', desc: 'Allows viewing, creating, updating and exporting leads in CRM database.' },
                    access_salesform: { title: 'Salesform Access', key: 'salesform', desc: 'Allows submitting custom lead intake forms and sales captures.' },
                    access_team: { title: 'Team Supervisory Access', key: 'team', desc: 'Allows managing sales team members, telecallers and lead re-assignments.' },
                    access_permissions: { title: 'Permission Templates Management', key: 'permissions', desc: 'Allows creating and editing system security role templates.' },
                    access_calling: { title: 'Calling & Power Dialer', key: 'calling', desc: 'Allows placing outbound phone calls and launching auto-dialer queues.' },
                    access_reports: { title: 'Performance Reports & Analytics', key: 'reports', desc: 'Allows viewing executive sales reports, caller metrics, and leaderboards.' },
                    access_automations: { title: 'AI Automations & Workflows', key: 'automations', desc: 'Allows viewing and configuring visual workflow rules and lead triggers.' },
                    access_tasks: { title: 'Pending Tasks & Follow-Ups', key: 'tasks', desc: 'Allows managing scheduled call follow-ups, tasks, and reminders.' },
                    access_billings: { title: 'Billing & Subscriptions', key: 'billings', desc: 'Allows viewing transaction history and purchasing license seats.' },
                    access_integrations: { title: 'Webhooks & Integrations', key: 'integrations', desc: 'Allows setting up Google Sheets, Meta Ads, and API webhooks.' },
                    access_ai_agents: { title: 'AI Sales Copilot & Voice Bots', key: 'aiAgents', desc: 'Allows telecallers to use AI Copilot battlecards and voice bot simulations.' },
                    view_lead: { title: 'Single Lead View Rights', key: 'leadView', desc: 'Allows opening full lead detail modals and activity timelines.' },
                    view_dashboard: { title: 'Executive Dashboard View', key: 'dashboardView', desc: 'Allows viewing top executive dashboard KPI metrics and directory.' },
                    view_leads_table: { title: 'Master Leads Directory Table', key: 'leadsTableView', desc: 'Allows viewing master leads table grid with status filters.' },
                  };

                  const current = categoryMap[activeEditorCategory] || { title: 'Access Control', key: 'leads', desc: 'Manage permissions.' };
                  const isEnabled = editingTemplate.rights[current.key];

                  return (
                    <div className="space-y-6">
                      <div className="border-b border-slate-200 pb-3">
                        <h3 className="text-lg font-bold text-slate-900">{current.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{current.desc}</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Enable {current.title}</p>
                          <p className="text-xs text-slate-500 mt-1">Users assigned to <span className="font-semibold text-slate-700">"{editingTemplate.name}"</span> will {isEnabled ? 'have full access' : 'be restricted'} for this feature.</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleRight(current.key)}
                          className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer p-1 ${
                            isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                            isEnabled ? 'translate-x-7' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>
                  );
                })() : null}

                {/* 3. TEMPLATES PANE (Exact match to Screenshot 3: WhatsApp Templates) */}
                {activeEditorCategory === 'tmpl_whatsapp' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left templates list (Screenshot 3) */}
                    <div className="lg:col-span-6 space-y-4 border-r border-slate-200/80 pr-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h3 className="text-base font-bold text-slate-900">Whatsapp template</h3>
                        <button
                          type="button"
                          onClick={() => handleToggleRight('whatsappTemplates')}
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            editingTemplate.rights.whatsappTemplates ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {editingTemplate.rights.whatsappTemplates ? 'Permission Granted' : 'Restricted'}
                        </button>
                      </div>

                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-center space-y-3">
                        <p className="text-sm font-bold text-slate-800">No templates found.</p>
                        <p className="text-xs text-slate-500">Create templates to start sending messages faster.</p>
                        <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer hover:bg-indigo-700">
                          + Create Template
                        </button>
                      </div>
                    </div>

                    {/* Right Tutorial Player Card (Exact match to Screenshot 3) */}
                    <div className="lg:col-span-6 flex items-center justify-center p-2">
                      <div className="w-full bg-slate-900 rounded-2xl p-4 text-white space-y-3 shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-slate-900 to-purple-900 opacity-90" />
                        <div className="relative z-10 space-y-3">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">
                            Tutorial Video
                          </span>
                          <h4 className="text-base font-bold">Introducing a Simpler Way to Manage WhatsApp Templates</h4>
                          <p className="text-xs text-slate-300">Standard messaging templates & automated triggers in telecrm</p>
                          
                          <div className="aspect-video rounded-xl bg-black/60 border border-slate-800 flex items-center justify-center cursor-pointer hover:scale-[1.01] transition-transform">
                            <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg font-bold">
                              ▶
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. SMS / EMAIL TEMPLATES */}
                {(activeEditorCategory === 'tmpl_sms' || activeEditorCategory === 'tmpl_email') && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-slate-900">
                      {activeEditorCategory === 'tmpl_sms' ? 'SMS Message Templates' : 'Email Messaging Templates'}
                    </h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Allow Template Usage</p>
                        <p className="text-xs text-slate-500">Users under this permission template can select verified templates.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleRight(activeEditorCategory === 'tmpl_sms' ? 'smsTemplates' : 'emailTemplates')}
                        className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer p-1 ${
                          editingTemplate.rights[activeEditorCategory === 'tmpl_sms' ? 'smsTemplates' : 'emailTemplates'] ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                          editingTemplate.rights[activeEditorCategory === 'tmpl_sms' ? 'smsTemplates' : 'emailTemplates'] ? 'translate-x-7' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. EMBEDDED APPS */}
                {activeEditorCategory === 'embedded_apps' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Embedded Apps Permissions</h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Allow Embedded Apps Integration</p>
                        <p className="text-xs text-slate-500">Enables embedded CRM sidebar extensions and custom web components.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleRight('embeddedApps')}
                        className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer p-1 ${
                          editingTemplate.rights.embeddedApps ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                          editingTemplate.rights.embeddedApps ? 'translate-x-7' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
