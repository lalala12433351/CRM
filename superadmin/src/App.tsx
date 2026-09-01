import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  BarChart3,
  Download,
  Plus,
  TrendingUp,
  Target,
  UserCheck,
  CheckCircle2,
  X,
  Search,
  Filter,
  Check,
  Building2,
  Sliders,
  DollarSign,
  PhoneCall,
  Mail,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { UserManagementView } from './components/UserManagementView';
import { RoleManagementView } from './components/RoleManagementView';
import { SystemSettingsView } from './components/SystemSettingsView';
import { ReportsView } from './components/ReportsView';

// Colors for Pie Chart matching Figma reference
const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function App() {
  const [activeNav, setActiveNav] = useState<'dashboard' | 'users' | 'roles' | 'settings' | 'reports'>('dashboard');
  const [subTab, setSubTab] = useState<'overview' | 'team' | 'leads' | 'deals'>('overview');

  // Modals & Feedback
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Lead Form State
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('Website');
  const [newLeadValue, setNewLeadValue] = useState('50000');

  // Mock Interactive State
  const [leads, setLeads] = useState([
    { id: '1', name: 'Sophia Chen', company: 'Nexus Global', email: 'sophia@nexus.io', source: 'Website', value: '$45,000', status: 'Qualified', agent: 'Rahul S.' },
    { id: '2', name: 'Marcus Vance', company: 'Apex Cargo', email: 'm.vance@apex.co', source: 'LinkedIn', value: '$120,000', status: 'Negotiation', agent: 'Priya K.' },
    { id: '3', name: 'Alina Becker', company: 'Skyline Realty', email: 'alina@skyline.de', source: 'Referral', value: '$85,000', status: 'Contacted', agent: 'David O.' },
    { id: '4', name: 'Rohan Gupta', company: 'Zephyr Tech', email: 'rohan@zephyr.in', source: 'Email', value: '$35,000', status: 'Proposal Sent', agent: 'Sneha M.' },
  ]);

  const [teamMembers, setTeamMembers] = useState([
    { id: 'u1', name: 'Rahul Sharma', email: 'rahul.s@pixbe.com', role: 'Sales Lead', target: '$5,00,000', achieved: '$4,85,000', rate: '97%', status: 'Active' },
    { id: 'u2', name: 'Priya Kapoor', email: 'priya.k@pixbe.com', role: 'Enterprise Exec', target: '$6,00,000', achieved: '$5,90,000', rate: '98%', status: 'Active' },
    { id: 'u3', name: 'David O\'Connor', email: 'david.o@pixbe.com', role: 'Counselor', target: '$4,00,000', achieved: '$3,80,000', rate: '95%', status: 'Active' },
    { id: 'u4', name: 'Sneha Menon', email: 'sneha.m@pixbe.com', role: 'Telecaller', target: '$3,50,000', achieved: '$3,40,000', rate: '97%', status: 'Active' },
  ]);

  const [deals, setDeals] = useState([
    { id: 'd1', title: 'Global SaaS Expansion', company: 'Nexus Global', value: '$1,50,000', stage: 'Contract Sent', prob: '90%' },
    { id: 'd2', title: 'Admissions Automation', company: 'Apex Institute', value: '$1,20,000', stage: 'Legal Review', prob: '85%' },
    { id: 'd3', title: 'Telecalling Power Dialer', company: 'Skyline Sales', value: '$1,00,000', stage: 'Final Pitch', prob: '75%' },
  ]);

  const [settings, setSettings] = useState({
    autoRoundRobin: true,
    callRecording: true,
    emailNotifications: true,
    targetAlerts: true,
    currency: 'USD',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add Lead Handler
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) return;

    const newLead = {
      id: String(Date.now()),
      name: newLeadName.trim(),
      company: `${newLeadName.trim()} Co`,
      email: newLeadEmail.trim() || `${newLeadName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      source: newLeadSource,
      value: `$${Number(newLeadValue).toLocaleString()}`,
      status: 'Qualified',
      agent: 'Rahul S.'
    };

    setLeads([newLead, ...leads]);
    setNewLeadName('');
    setNewLeadEmail('');
    setIsAddLeadModalOpen(false);
    showToast(`Lead "${newLead.name}" added successfully!`);
  };

  // Export Report Handler (Generates and downloads a real CSV in browser)
  const handleExportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Lead Name,Company,Email,Source,Value,Status,Agent\n"
      + leads.map(l => `"${l.name}","${l.company}","${l.email}","${l.source}","${l.value}","${l.status}","${l.agent}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Sales Report exported successfully as CSV!");
  };

  // Line Chart Data (matching Figma screenshot)
  const lineChartData = [
    { name: 'Jan', actual: 450000, target: 400000 },
    { name: 'Feb', actual: 520000, target: 460000 },
    { name: 'Mar', actual: 680000, target: 500000 },
    { name: 'Apr', actual: 720000, target: 550000 },
    { name: 'May', actual: 860000, target: 600000 },
    { name: 'Jun', actual: 920000, target: 650000 },
  ];

  // Pie Chart Data (matching Figma screenshot)
  const pieChartData = [
    { name: 'Website', value: 35 },
    { name: 'LinkedIn', value: 28 },
    { name: 'Email', value: 20 },
    { name: 'Referrals', value: 12 },
    { name: 'Other', value: 5 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex antialiased select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg flex items-center gap-2 border border-slate-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR (Matching Figma mockup) */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col p-4 shrink-0">
        <div className="px-3 py-2 text-xs font-bold text-slate-400 tracking-tight">
          Admin Panel
        </div>

        <nav className="mt-3 space-y-1">
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeNav === 'dashboard'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveNav('users')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeNav === 'users'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
          </button>

          <button
            onClick={() => setActiveNav('roles')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeNav === 'roles'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Role Management</span>
          </button>

          <button
            onClick={() => setActiveNav('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeNav === 'settings'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>System Settings</span>
          </button>

          <button
            onClick={() => setActiveNav('reports')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeNav === 'reports'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reports</span>
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100 text-[11px] text-slate-400 px-3">
          Pixbe Admin v1.0.0
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {activeNav === 'dashboard' && (
          <>
            {/* HEADER: Title & Top Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive overview of your sales operations</p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Report</span>
            </button>

            <button
              onClick={() => setIsAddLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-slate-800 active:bg-slate-400 active:text-black transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Lead</span>
            </button>
          </div>
        </div>

        {/* 4 KPI CARDS ROW (Exact match to Figma screenshot) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Revenue */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Total Revenue</span>
              <span className="text-slate-400 text-xs font-semibold">$</span>
            </div>
            <div className="my-3">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                $20,42,000
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black text-white text-[11px] font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span>99.6% of target</span>
              </span>
            </div>
          </div>

          {/* Card 2: Active Leads */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Active Leads</span>
              <Target className="w-4 h-4 text-slate-400" />
            </div>
            <div className="my-3">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {leads.length}
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black text-white text-[11px] font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span>+23% this month</span>
              </span>
            </div>
          </div>

          {/* Card 3: Team Performance */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Team Performance</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="my-3">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                96.5%
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-1.5 bg-black rounded-full" />
              <span className="text-[11px] text-slate-500 font-medium">Average</span>
            </div>
          </div>

          {/* Card 4: Active Deals */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Active Deals</span>
              <Target className="w-4 h-4 text-slate-400" />
            </div>
            <div className="my-3">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {deals.length}
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black text-white text-[11px] font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span>$3,70,000 pipeline</span>
              </span>
            </div>
          </div>
        </div>

        {/* SUB-TABS PILL SWITCHER (Overview | Team | Leads | Deals) */}
        <div className="w-full bg-slate-200/60 p-1 rounded-xl flex items-center gap-1 text-xs">
          {(['overview', 'team', 'leads', 'deals'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`flex-1 py-1.5 rounded-lg font-semibold capitalize transition-all cursor-pointer text-center ${
                subTab === tab
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 active:bg-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW (Charts & Bottom Quick Actions matching screenshot) */}
        {subTab === 'overview' && (
          <>
            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend Line Chart */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="text-sm font-bold text-slate-900">Revenue Trend</div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '11px' }}
                        formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                      />
                      {/* Actual revenue line (Solid blue with circles) */}
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#2563EB"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#FFFFFF', stroke: '#2563EB', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                      {/* Target revenue line (Dashed green with circles) */}
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#10B981"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: '#10B981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Lead Sources Pie Chart */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="text-sm font-bold text-slate-900">Lead Sources</div>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={11}
                        fontWeight={600}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '11px' }}
                        formatter={(val: any) => [`${val}%`, 'Share']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* BOTTOM 3 QUICK ACTION CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setSubTab('team')}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5 hover:bg-slate-50 active:bg-slate-200 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Manage Team</div>
                  <div className="text-[11px] text-slate-500">Add users, assign roles</div>
                </div>
              </div>

              <div
                onClick={() => showNotice('Sales targets updated to $2.5M for Q3!')}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5 hover:bg-slate-50 active:bg-slate-200 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Set Targets</div>
                  <div className="text-[11px] text-slate-500">Update sales goals</div>
                </div>
              </div>

              <div
                onClick={handleExportReport}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5 hover:bg-slate-50 active:bg-slate-200 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Generate Reports</div>
                  <div className="text-[11px] text-slate-500">Export analytics</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: TEAM */}
        {subTab === 'team' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">Sales Representatives Leaderboard</div>
              <span className="text-xs text-slate-500">{teamMembers.length} Active Counselors</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Sales Target</th>
                    <th className="py-2.5 px-3">Achieved</th>
                    <th className="py-2.5 px-3">Rate</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[11px] text-slate-500">{m.email}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{m.role}</td>
                      <td className="py-3 px-3 font-medium">{m.target}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{m.achieved}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-600">{m.rate}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LEADS */}
        {subTab === 'leads' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">Active Ingested Leads</div>
              <button
                onClick={() => setIsAddLeadModalOpen(true)}
                className="px-3 py-1.5 bg-black text-white rounded text-xs font-semibold hover:bg-slate-800 active:bg-slate-300 active:text-black cursor-pointer"
              >
                + Add Lead
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Lead</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Value</th>
                    <th className="py-2.5 px-3">Assigned Agent</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{l.name}</div>
                        <div className="text-[11px] text-slate-500">{l.company} • {l.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {l.source}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">{l.value}</td>
                      <td className="py-3 px-3 text-slate-600">{l.agent}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DEALS */}
        {subTab === 'deals' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">Pipeline Deals</div>
              <span className="text-xs font-semibold text-slate-500">3 Deals in Closing</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {deals.map((d) => (
                <div key={d.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="text-xs font-bold text-slate-900">{d.title}</div>
                  <div className="text-slate-500 text-[11px]">{d.company}</div>
                  <div className="text-lg font-extrabold text-slate-900">{d.value}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
                    <span className="font-semibold text-slate-700">{d.stage}</span>
                    <span className="text-emerald-600 font-bold">{d.prob} probability</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          </>
        )}

        {/* USER MANAGEMENT VIEW */}
        {activeNav === 'users' && <UserManagementView />}

        {/* ROLE MANAGEMENT VIEW */}
        {activeNav === 'roles' && <RoleManagementView />}

        {/* SYSTEM SETTINGS VIEW */}
        {activeNav === 'settings' && <SystemSettingsView />}

        {/* REPORTS VIEW */}
        {activeNav === 'reports' && <ReportsView />}
      </main>

      {/* ADD LEAD MODAL */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">+ Add New Lead</h3>
              <button
                onClick={() => setIsAddLeadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lead / Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="alex@company.com"
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Lead Source</label>
                  <select
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
                  >
                    <option value="Website">Website</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Email">Email</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Deal Value ($)</label>
                  <input
                    type="number"
                    value={newLeadValue}
                    onChange={(e) => setNewLeadValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-slate-800 active:bg-slate-400 active:text-black transition-all cursor-pointer"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
