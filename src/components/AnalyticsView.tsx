import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Target, 
  Zap, 
  AlertTriangle, 
  PieChart as PieIcon, 
  Calendar,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  PhoneCall,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  Percent,
  Compass
} from 'lucide-react';
import { Lead, HourlyMetric } from '../types';
import { 
  ResponsiveContainer, 
  ComposedChart,
  BarChart, 
  Bar, 
  LineChart,
  Line,
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface AnalyticsViewProps {
  leads: Lead[];
  hourlyMetrics: HourlyMetric[];
}

type TimeRange = 'today' | '7d' | '30d' | 'quarter';
type ChartMode = 'cpl_volume' | 'spend_revenue' | 'hourly_flow';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ leads, hourlyMetrics }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [activeChartMode, setActiveChartMode] = useState<ChartMode>('cpl_volume');
  const [sortBy, setSortBy] = useState<'roi' | 'cpl' | 'leads' | 'revenue'>('revenue');

  // Baseline channel benchmarks and realistic CPL/CPA data
  const baseChannelData = useMemo(() => [
    { 
      source: 'Facebook Ads', 
      adSpend: 38400, 
      defaultCpl: 240, 
      defaultCpa: 1420, 
      impressions: 142000, 
      clicks: 4800,
      color: '#4f46e5',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    { 
      source: 'Google Ads', 
      adSpend: 46200, 
      defaultCpl: 385, 
      defaultCpa: 1780, 
      impressions: 98000, 
      clicks: 3900,
      color: '#0284c7',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
    },
    { 
      source: 'IndiaMart', 
      adSpend: 21600, 
      defaultCpl: 180, 
      defaultCpa: 1150, 
      impressions: 64000, 
      clicks: 2200,
      color: '#059669',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    { 
      source: 'WhatsApp', 
      adSpend: 9500, 
      defaultCpl: 95, 
      defaultCpa: 680, 
      impressions: 45000, 
      clicks: 3100,
      color: '#10b981',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    { 
      source: 'JustDial', 
      adSpend: 18200, 
      defaultCpl: 320, 
      defaultCpa: 1650, 
      impressions: 42000, 
      clicks: 1400,
      color: '#f59e0b',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    { 
      source: '99acres', 
      adSpend: 24600, 
      defaultCpl: 410, 
      defaultCpa: 2100, 
      impressions: 51000, 
      clicks: 1600,
      color: '#ec4899',
      badgeColor: 'bg-pink-50 text-pink-700 border-pink-200'
    },
  ], []);

  // Multiplier depending on selected time range
  const timeMultiplier = useMemo(() => {
    switch (timeRange) {
      case 'today': return 0.25;
      case '7d': return 1;
      case '30d': return 3.8;
      case 'quarter': return 11.2;
    }
  }, [timeRange]);

  // Dynamic channel statistics computed from leads & benchmarks
  const channelStats = useMemo(() => {
    return baseChannelData.map((ch) => {
      const srcLeads = leads.filter((l) => l.source === ch.source || (ch.source === 'Facebook Ads' && l.source === 'Meta Ads'));
      const capturedCount = Math.max(srcLeads.length, Math.round((ch.adSpend / ch.defaultCpl) * (timeMultiplier * 0.4)));
      const convertedCount = Math.max(
        srcLeads.filter((l) => l.status === 'Converted').length, 
        Math.round(capturedCount * (ch.source === 'WhatsApp' ? 0.22 : ch.source === 'IndiaMart' ? 0.19 : 0.15))
      );
      
      const computedSpend = Math.round(ch.adSpend * timeMultiplier);
      const computedRevenue = convertedCount * 85000 + srcLeads.reduce((acc, c) => acc + (c.dealValue || 0), 0);
      const realCpl = Math.round(computedSpend / (capturedCount || 1));
      const realCpa = convertedCount > 0 ? Math.round(computedSpend / convertedCount) : ch.defaultCpa;
      const netProfit = computedRevenue - computedSpend;
      const roas = computedSpend > 0 ? (computedRevenue / computedSpend).toFixed(1) : '0.0';
      const convRate = capturedCount > 0 ? ((convertedCount / capturedCount) * 100).toFixed(1) : '0';

      return {
        ...ch,
        capturedLeads: capturedCount,
        convertedDeals: convertedCount,
        adSpend: computedSpend,
        revenue: computedRevenue,
        cpl: realCpl,
        cpa: realCpa,
        netProfit,
        roas: `${roas}x`,
        roasVal: parseFloat(roas),
        conversionRate: `${convRate}%`,
        conversionRateVal: parseFloat(convRate),
        cplEfficiency: realCpl <= 200 ? 'Optimal' : realCpl <= 350 ? 'Moderate' : 'High'
      };
    });
  }, [leads, baseChannelData, timeMultiplier]);

  // Filtered by selected channel
  const filteredChannels = useMemo(() => {
    if (selectedChannel === 'ALL') return channelStats;
    return channelStats.filter((c) => c.source === selectedChannel);
  }, [channelStats, selectedChannel]);

  // Aggregated High-Level KPIs
  const totalMetrics = useMemo(() => {
    const totalSpend = filteredChannels.reduce((sum, c) => sum + c.adSpend, 0);
    const totalLeads = filteredChannels.reduce((sum, c) => sum + c.capturedLeads, 0);
    const totalConversions = filteredChannels.reduce((sum, c) => sum + c.convertedDeals, 0);
    const totalRev = filteredChannels.reduce((sum, c) => sum + c.revenue, 0);
    const blendedCpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
    const blendedCpa = totalConversions > 0 ? Math.round(totalSpend / totalConversions) : 0;
    const avgRoas = totalSpend > 0 ? (totalRev / totalSpend).toFixed(1) : '0.0';
    const overallConvRate = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : '0.0';

    return {
      totalSpend,
      totalLeads,
      totalConversions,
      totalRev,
      blendedCpl,
      blendedCpa,
      avgRoas,
      overallConvRate
    };
  }, [filteredChannels]);

  // Sorted list for data matrix
  const sortedChannels = useMemo(() => {
    const list = [...filteredChannels];
    list.sort((a, b) => {
      if (sortBy === 'roi') return b.roasVal - a.roasVal;
      if (sortBy === 'cpl') return a.cpl - b.cpl;
      if (sortBy === 'leads') return b.capturedLeads - a.capturedLeads;
      return b.revenue - a.revenue;
    });
    return list;
  }, [filteredChannels, sortBy]);

  // Chart dataset for Channel Comparison
  const channelChartData = useMemo(() => {
    return channelStats.map((item) => ({
      name: item.source.replace(' Ads', ''),
      fullName: item.source,
      Leads: item.capturedLeads,
      Conversions: item.convertedDeals,
      CPL: item.cpl,
      CPA: item.cpa,
      Spend: item.adSpend,
      Revenue: item.revenue,
      ROAS: item.roasVal,
      benchmark: 250
    }));
  }, [channelStats]);

  // Hourly Activity Trend Data with smoothed metrics
  const hourlyTrendData = useMemo(() => {
    return (hourlyMetrics.length > 0 ? hourlyMetrics : [
      { hour: '09:00', totalCalls: 24, connectedCalls: 18, leadsCaptured: 14, conversions: 2, revenue: 65000 },
      { hour: '10:00', totalCalls: 48, connectedCalls: 36, leadsCaptured: 22, conversions: 4, revenue: 140000 },
      { hour: '11:00', totalCalls: 72, connectedCalls: 58, leadsCaptured: 31, conversions: 6, revenue: 245000 },
      { hour: '12:00', totalCalls: 62, connectedCalls: 49, leadsCaptured: 24, conversions: 5, revenue: 195000 },
      { hour: '13:00', totalCalls: 32, connectedCalls: 22, leadsCaptured: 10, conversions: 2, revenue: 55000 },
      { hour: '14:00', totalCalls: 56, connectedCalls: 42, leadsCaptured: 18, conversions: 4, revenue: 165000 },
      { hour: '15:00', totalCalls: 66, connectedCalls: 52, leadsCaptured: 26, conversions: 5, revenue: 215000 },
      { hour: '16:00', totalCalls: 70, connectedCalls: 56, leadsCaptured: 25, conversions: 6, revenue: 280000 },
      { hour: '17:00', totalCalls: 44, connectedCalls: 32, leadsCaptured: 14, conversions: 3, revenue: 110000 },
      { hour: '18:00', totalCalls: 26, connectedCalls: 19, leadsCaptured: 8, conversions: 1, revenue: 45000 },
    ]).map(h => ({
      ...h,
      callEfficiency: h.totalCalls > 0 ? Math.round((h.connectedCalls / h.totalCalls) * 100) : 0,
      leadCostEquivalent: Math.round(350 - (h.conversions * 25))
    }));
  }, [hourlyMetrics]);

  // Donut chart spend breakdown
  const spendPieData = useMemo(() => {
    return channelStats.map(c => ({
      name: c.source,
      value: c.adSpend,
      color: c.color
    }));
  }, [channelStats]);

  // Funnel Leakage Stages
  const funnelStages = [
    { stage: 'Campaign Impressions', count: '442,000', drop: '0%', color: 'bg-indigo-600', width: '100%' },
    { stage: 'Ad Clicks (CTR 3.8%)', count: '16,900', drop: '96.2%', color: 'bg-indigo-500', width: '78%' },
    { stage: 'Inbound Leads Captured', count: totalMetrics.totalLeads.toString(), drop: '72.4%', color: 'bg-sky-500', width: '58%' },
    { stage: 'Telecaller Connected (82%)', count: Math.round(totalMetrics.totalLeads * 0.82).toString(), drop: '18.0%', color: 'bg-teal-500', width: '42%' },
    { stage: 'Sales Qualified Opportunities', count: Math.round(totalMetrics.totalLeads * 0.45).toString(), drop: '45.1%', color: 'bg-amber-500', width: '28%' },
    { stage: 'Final Converted Deals', count: totalMetrics.totalConversions.toString(), drop: '52.6%', color: 'bg-emerald-600', width: '18%' }
  ];

  return (
    <div className="p-3.5 sm:p-5 md:p-6 space-y-5 max-w-7xl mx-auto text-slate-900 font-sans">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Marketing ROI & Cost Per Lead (CPL) Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Real-time acquisition spend, campaign CPL benchmarks, telecaller velocity, and funnel attribution.
          </p>
        </div>

        {/* Global Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Channel Select */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Marketing Channels</option>
              {baseChannelData.map((c) => (
                <option key={c.source} value={c.source}>{c.source}</option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
            {(['today', '7d', '30d', 'quarter'] as TimeRange[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                  timeRange === t 
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs' 
                    : 'hover:text-slate-900'
                }`}
              >
                {t === 'today' ? 'Today' : t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : 'Quarter'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Blended CPL */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Blended CPL</span>
            <Target className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900">
            ₹{totalMetrics.blendedCpl}
          </p>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-700 font-medium">
            <ArrowDownRight className="w-3 h-3" />
            <span>-12.4% vs target</span>
          </div>
        </div>

        {/* Blended CPA */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Cost / Deal (CPA)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900">
            ₹{totalMetrics.blendedCpa.toLocaleString()}
          </p>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-700 font-medium">
            <ArrowDownRight className="w-3 h-3" />
            <span>Optimal margin</span>
          </div>
        </div>

        {/* Total Ad Spend */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Ad Spend</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900">
            ₹{totalMetrics.totalSpend.toLocaleString()}
          </p>
          <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-medium">
            <span>Allocated: 100%</span>
          </div>
        </div>

        {/* Leads Captured */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Leads</span>
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900">
            {totalMetrics.totalLeads}
          </p>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-700 font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>+18% Inflow</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Lead-to-Won %</span>
            <Percent className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900">
            {totalMetrics.overallConvRate}%
          </p>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-700 font-medium">
            <span>{totalMetrics.totalConversions} Closed Deals</span>
          </div>
        </div>

        {/* ROAS Multiplier */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Return on Spend</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-indigo-700">
            {totalMetrics.avgRoas}x
          </p>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-700 font-medium">
            <span>₹{(totalMetrics.totalRev).toLocaleString()} Rev</span>
          </div>
        </div>
      </div>

      {/* Main Graph Card: Multi-Mode Dual-Axis Analytics */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>
                {activeChartMode === 'cpl_volume' 
                  ? 'Channel CPL (Cost/Lead) vs Lead Volume Performance'
                  : activeChartMode === 'spend_revenue' 
                  ? 'Marketing Ad Spend vs Generated Pipeline Revenue (₹)' 
                  : 'Hourly Telecaller Activity, Call Connectivity & Conversions'}
              </span>
            </h2>
            <p className="text-xs text-slate-500">Live ROI & CPL tracking across all acquisition campaigns</p>
          </div>

          {/* Toggle Metrics Sub-Tab */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto ios-scroll">
            <button
              onClick={() => setActiveChartMode('cpl_volume')}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap text-center ${
                activeChartMode === 'cpl_volume' 
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CPL vs Volume
            </button>
            <button
              onClick={() => setActiveChartMode('spend_revenue')}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap text-center ${
                activeChartMode === 'spend_revenue' 
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Spend vs Revenue
            </button>
            <button
              onClick={() => setActiveChartMode('hourly_flow')}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap text-center ${
                activeChartMode === 'hourly_flow' 
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hourly Activity
            </button>
          </div>
        </div>

        {/* Chart View Area */}
        <div className="h-64 sm:h-80 w-full pt-2">
          {activeChartMode === 'cpl_volume' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={channelChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                />
                <YAxis 
                  yAxisId="left" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  label={{ value: 'Leads Count', angle: -90, position: 'insideLeft', offset: 20, fontSize: 10, fill: '#64748b' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#f59e0b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `₹${v}`}
                  label={{ value: 'Cost Per Lead (₹)', angle: 90, position: 'insideRight', offset: 5, fontSize: 10, fill: '#d97706' }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5 font-sans min-w-[200px]">
                          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">{data.fullName}</p>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Captured Leads:</span>
                            <span className="font-bold text-slate-900">{data.Leads}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Converted Deals:</span>
                            <span className="font-bold text-emerald-700">{data.Conversions}</span>
                          </div>
                          <div className="flex justify-between items-center text-amber-700 font-medium">
                            <span>Cost Per Lead (CPL):</span>
                            <span className="font-bold font-mono">₹{data.CPL}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Cost Per Deal (CPA):</span>
                            <span className="font-mono">₹{data.CPA}</span>
                          </div>
                          <div className="flex justify-between items-center text-indigo-700 font-bold pt-1 border-t border-slate-100">
                            <span>ROAS:</span>
                            <span>{data.ROAS}x Return</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} 
                  iconType="circle"
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="Leads" 
                  name="Captured Leads" 
                  fill="#4f46e5" 
                  radius={[4, 4, 0, 0]} 
                  barSize={24} 
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="Conversions" 
                  name="Converted Deals" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={24} 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="CPL" 
                  name="Cost Per Lead (₹)" 
                  stroke="#d97706" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#f59e0b', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {activeChartMode === 'spend_revenue' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelChartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000)}k`} 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5 font-sans min-w-[190px]">
                          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">{data.fullName}</p>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Ad Spend:</span>
                            <span className="font-bold text-slate-800">₹{data.Spend.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-700 font-bold">
                            <span>Revenue Realized:</span>
                            <span>₹{data.Revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-indigo-700 font-bold pt-1 border-t border-slate-100">
                            <span>Net Profit Multiplier:</span>
                            <span>{data.ROAS}x ROAS</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                <Bar dataKey="Spend" name="Marketing Ad Spend (₹)" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={26} />
                <Bar dataKey="Revenue" name="Generated Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeChartMode === 'hourly_flow' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#10b981" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(v) => `₹${v / 1000}k`} 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5 font-sans min-w-[190px]">
                          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">Time: {data.hour}</p>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Total Calls Dialed:</span>
                            <span className="font-bold">{data.totalCalls}</span>
                          </div>
                          <div className="flex justify-between items-center text-indigo-700">
                            <span>Calls Connected:</span>
                            <span className="font-bold">{data.connectedCalls} ({data.callEfficiency}%)</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-700 font-bold pt-1 border-t border-slate-100">
                            <span>Hourly Revenue:</span>
                            <span>₹{data.revenue?.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                <Area 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="connectedCalls" 
                  name="Connected Telecaller Calls" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCalls)" 
                />
                <Area 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Hourly Revenue (₹)" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2-Column Analytical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Channel Cost Efficiency Benchmark */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>Channel CPL vs Benchmark Efficiency</span>
              </h3>
              <p className="text-[11px] text-slate-500">Target Benchmark: ₹250 / Lead</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Optimal: &lt;₹250
            </span>
          </div>

          {/* Cost Bars */}
          <div className="space-y-3 pt-1">
            {channelStats.map((c) => {
              const percentageOfMax = Math.min(100, Math.round((c.cpl / 450) * 100));
              const isOptimal = c.cpl <= 250;

              return (
                <div key={c.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{c.source}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${c.badgeColor}`}>
                        {c.conversionRate} Conv
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-[11px] text-slate-500 font-sans">CPL:</span>
                      <span className={`font-bold ${isOptimal ? 'text-emerald-700' : 'text-amber-700'}`}>
                        ₹{c.cpl}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans">({c.cplEfficiency})</span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all ${
                        c.cpl <= 150 ? 'bg-teal-500' : c.cpl <= 250 ? 'bg-emerald-500' : c.cpl <= 350 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${percentageOfMax}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Best Performing CPL Channel:</span>
            </span>
            <span className="font-bold text-slate-900">WhatsApp CRM (₹95 / lead • 22.4% conv)</span>
          </div>
        </div>

        {/* Right: Ad Spend Distribution Share */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <PieIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ad Spend Allocation Share</span>
              </h3>
              <span className="text-xs font-bold text-slate-800">
                ₹{totalMetrics.totalSpend.toLocaleString()}
              </span>
            </div>

            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {spendPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Ad Spend']}
                    contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compact Legend Grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100 text-[11px]">
            {spendPieData.map((item) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="font-bold text-slate-900 ml-auto font-mono">
                  {Math.round((item.value / (totalMetrics.totalSpend || 1)) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Campaign Matrix Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Channel Performance & Unit Economics Breakdown</span>
            </h3>
            <p className="text-[11px] text-slate-500">Comprehensive breakdown of CPL, CPA, conversion rates, and ROAS</p>
          </div>

          {/* Sort Controller */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-800 font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="revenue">Generated Revenue</option>
              <option value="roi">ROAS Multiplier</option>
              <option value="cpl">Lowest CPL</option>
              <option value="leads">Total Leads</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">Marketing Source</th>
                <th className="px-3 py-2.5">Ad Budget Spend</th>
                <th className="px-3 py-2.5">Leads Captured</th>
                <th className="px-3 py-2.5">Cost / Lead (CPL)</th>
                <th className="px-3 py-2.5">Won Deals</th>
                <th className="px-3 py-2.5">Cost / Deal (CPA)</th>
                <th className="px-3 py-2.5">Conversion %</th>
                <th className="px-3 py-2.5">Realized Revenue</th>
                <th className="px-3 py-2.5 text-right">Return on Ad Spend (ROAS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedChannels.map((st) => (
                <tr key={st.source} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3 py-2.5 font-bold text-slate-900 flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                    <span>{st.source}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono">₹{st.adSpend.toLocaleString()}</td>
                  <td className="px-3 py-2.5 font-bold text-slate-900 font-mono">{st.capturedLeads}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${
                      st.cpl <= 200 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : st.cpl <= 350 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      ₹{st.cpl}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-emerald-700 font-bold font-mono">{st.convertedDeals}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-600">₹{st.cpa.toLocaleString()}</td>
                  <td className="px-3 py-2.5 font-bold text-slate-800">{st.conversionRate}</td>
                  <td className="px-3 py-2.5 font-bold text-emerald-700 font-mono">₹{st.revenue.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-extrabold text-indigo-700 font-mono">
                    <span className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {st.roas}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marketing Funnel Leakage Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ad Click to Closed Deal Funnel Velocity & Leakage</span>
          </h3>
          <p className="text-[11px] text-slate-500">Identify stage-by-stage drop-off to eliminate wasted ad spend</p>
        </div>

        <div className="space-y-2 pt-1">
          {funnelStages.map((st, idx) => (
            <div key={st.stage} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{idx + 1}. {st.stage}</span>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="font-bold text-slate-900">{st.count}</span>
                  {idx > 0 && (
                    <span className="text-[10px] text-rose-600 font-sans font-medium">({st.drop} drop-off)</span>
                  )}
                </div>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div className={`h-full rounded-full ${st.color} transition-all`} style={{ width: st.width }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
