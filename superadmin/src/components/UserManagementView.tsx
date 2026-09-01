import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Key,
  X
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Super Admin' | 'Sales Manager' | 'Senior Counselor' | 'Telecaller';
  leadsAssigned: number;
  dealsWon: number;
  status: 'Active' | 'Inactive';
  lastActive: string;
}

const INITIAL_USERS: UserItem[] = [
  { id: '1', name: 'Rahul Sharma', email: 'rahul.s@pixbe.com', phone: '+91 98765 43210', role: 'Sales Manager', leadsAssigned: 42, dealsWon: 18, status: 'Active', lastActive: '5 mins ago' },
  { id: '2', name: 'Priya Kapoor', email: 'priya.k@pixbe.com', phone: '+91 98765 43211', role: 'Senior Counselor', leadsAssigned: 38, dealsWon: 14, status: 'Active', lastActive: '12 mins ago' },
  { id: '3', name: 'David O\'Connor', email: 'david.o@pixbe.com', phone: '+91 98765 43212', role: 'Senior Counselor', leadsAssigned: 35, dealsWon: 12, status: 'Active', lastActive: '1 hour ago' },
  { id: '4', name: 'Sneha Menon', email: 'sneha.m@pixbe.com', phone: '+91 98765 43213', role: 'Telecaller', leadsAssigned: 64, dealsWon: 9, status: 'Active', lastActive: '2 mins ago' },
  { id: '5', name: 'Vikram Joshi', email: 'vikram.j@pixbe.com', phone: '+91 98765 43214', role: 'Telecaller', leadsAssigned: 58, dealsWon: 8, status: 'Inactive', lastActive: 'Yesterday' },
];

export function UserManagementView() {
  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [role, setRole] = useState<UserItem['role']>('Telecaller');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newUser: UserItem = {
      id: String(Date.now()),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      leadsAssigned: 0,
      dealsWon: 0,
      status: 'Active',
      lastActive: 'Just now'
    };

    setUsers([newUser, ...users]);
    setName('');
    setEmail('');
    setIsAddModalOpen(false);
    showToast(`User ${newUser.name} created successfully!`);
  };

  const toggleUserStatus = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const next = u.status === 'Active' ? 'Inactive' : 'Active';
        showToast(`User ${u.name} is now ${next}`);
        return { ...u, status: next };
      }
      return u;
    }));
  };

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

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
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-xs text-slate-500">Manage agents, telecallers, and administrative team members</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-slate-800 active:bg-slate-300 active:text-black transition-all cursor-pointer shadow-2xs self-start"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Add User</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Team</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{users.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Active Now</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">
            {users.filter(u => u.status === 'Active').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Deals Closed</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {users.reduce((acc, u) => acc + u.dealsWon, 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Top Performer</span>
          <div className="text-sm font-extrabold text-slate-900 mt-1 truncate">Rahul Sharma (18 deals)</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by user name or email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="Sales Manager">Sales Manager</option>
            <option value="Senior Counselor">Senior Counselor</option>
            <option value="Telecaller">Telecaller</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Leads</th>
                <th className="py-3 px-4 text-center">Deals Won</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.phone}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-semibold border border-slate-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold">{u.leadsAssigned}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900">{u.dealsWon}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all active:scale-95 ${
                        u.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {u.status}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => showToast(`Reset password email sent to ${u.email}`)}
                        className="p-1.5 rounded hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-slate-700"
                        title="Reset Password"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => showToast(`Editing permissions for ${u.name}`)}
                        className="p-1.5 rounded hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-slate-700"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">+ Add Team Member</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karan Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="karan.v@pixbe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="Telecaller">Telecaller</option>
                    <option value="Senior Counselor">Senior Counselor</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-slate-800 active:bg-slate-300 active:text-black transition-all cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
