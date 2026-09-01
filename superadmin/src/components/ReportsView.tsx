import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  PhoneCall,
  DollarSign,
  Users,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const SOURCE_REPORTS = [
  { source: 'Website Forms', leads: 48, closed: 18, rate: '37.5%', revenue: '$8,10,000' },
  { source: 'LinkedIn InMail', leads: 38, closed: 12, rate: '31.5%', revenue: '$5,70,000' },
  { source: 'Meta / Facebook Leads', leads: 34, closed: 9, rate: '26.4%', revenue: '$3,60,000' },
  { source: 'Direct Client Referrals', leads: 16, closed: 8, rate: '50.0%', revenue: '$2,42,000' },
  { source: 'IndiaMart & JustDial', leads: 12, closed: 3, rate: '25.0%', revenue: '$60,000' },
];

const AGENT_REPORTS = [
  { name: 'Rahul Sharma', dials: 284, connects: 142, rate: '50.0%', deals: 18, won: '$8,10,000' },
  { name: 'Priya Kapoor', dials: 256, connects: 138, rate: '53.9%', deals: 14, won: '$6,30,000' },
  { name: 'David O\'Connor', dials: 240, connects: 110, rate: '45.8%', deals: 12, won: '$3,80,000' },
  { name: 'Sneha Menon', dials: 310, connects: 155, rate: '50.0%', deals: 9, won: '$2,22,000' },
];

const BAR_CHART_DATA = [
  { channel: 'Website', rev: 810 },
  { channel: 'LinkedIn', rev: 570 },
  { channel: 'Meta Ads', rev: 360 },
  { channel: 'Referral', rev: 242 },
  { channel: 'IndiaMart', rev: 60 },
];

export function ReportsView() {
  const [dateRange, setDateRange] = useState('Month to Date (Aug 2026)');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Channel,Total Leads,Deals Closed,Conversion Rate,Revenue Generated\n"
      + SOURCE_REPORTS.map(r => `"${r.source}","${r.leads}","${r.closed}","${r.rate}","${r.revenue}"`).join("\n")
      + "\n\nAgent,Dials,Connects,Connect Rate,Deals Won,Total Revenue\n"
      + AGENT_REPORTS.map(a => `"${a.name}","${a.dials}","${a.connects}","${a.rate}","${a.deals}","${a.won}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `comprehensive_sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Analytics & Financial Report downloaded successfully!');
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
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Performance & Financial Reports</h2>
          <p className="text-xs text-slate-500">In-depth channel attribution, sales velocity, and telecalling analytics</p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none shadow-2xs"
          >
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Month to Date (Aug 2026)">Month to Date (Aug 2026)</option>
            <option value="Q3 2026 (July - Sept)">Q3 2026 (July - Sept)</option>
            <option value="Year 2026">Year 2026</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-slate-800 active:bg-slate-300 active:text-black transition-all cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Gross Revenue</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">$20,42,000</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">99.6% Target Attained</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Blended Win Rate</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">36.4%</div>
          <div className="text-[11px] text-slate-500 mt-1">50 total closed deals</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Outbound Dials</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">1,090 Calls</div>
          <div className="text-[11px] text-slate-500 mt-1">545 total connects</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Avg Sales Cycle</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">11.4 Days</div>
          <div className="text-[11px] text-slate-500 mt-1">From inquiry to close</div>
        </div>
      </div>

      {/* Channel Attribution Bar Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="text-sm font-bold text-slate-900">Revenue Contribution by Ingestion Channel ($ in Thousands)</div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={BAR_CHART_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="channel" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '11px' }}
                formatter={(val: any) => [`$${val}k`, 'Revenue']}
              />
              <Bar dataKey="rev" fill="#0F172A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Channel Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
          Source Conversion & Revenue Matrix
        </div>
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold">
            <tr>
              <th className="py-2.5 px-4">Channel Source</th>
              <th className="py-2.5 px-4 text-center">Inquiries</th>
              <th className="py-2.5 px-4 text-center">Deals Closed</th>
              <th className="py-2.5 px-4 text-center">Conversion %</th>
              <th className="py-2.5 px-4 text-right">Revenue Generated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {SOURCE_REPORTS.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-900">{r.source}</td>
                <td className="py-3 px-4 text-center">{r.leads}</td>
                <td className="py-3 px-4 text-center font-semibold">{r.closed}</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    {r.rate}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-slate-900">{r.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Counselor Productivity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
          Counselor & Telecaller Performance Table
        </div>
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold">
            <tr>
              <th className="py-2.5 px-4">Representative</th>
              <th className="py-2.5 px-4 text-center">Dials</th>
              <th className="py-2.5 px-4 text-center">Connects</th>
              <th className="py-2.5 px-4 text-center">Connect %</th>
              <th className="py-2.5 px-4 text-center">Deals Won</th>
              <th className="py-2.5 px-4 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {AGENT_REPORTS.map((a, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-900">{a.name}</td>
                <td className="py-3 px-4 text-center">{a.dials}</td>
                <td className="py-3 px-4 text-center font-semibold">{a.connects}</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">{a.rate}</td>
                <td className="py-3 px-4 text-center font-extrabold text-slate-900">{a.deals}</td>
                <td className="py-3 px-4 text-right font-extrabold text-slate-900">{a.won}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
