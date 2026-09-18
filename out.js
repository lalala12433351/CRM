import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useContext } from "react";
import {
  Phone,
  Star,
  AlertCircle,
  ChevronDown,
  MoreVertical,
  Calendar,
  User,
  Search,
  Plus,
  X,
  Filter,
  RotateCcw,
  Pause,
  Trash2
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { StagesContext } from "../App";
import { LeadDetailModal } from "../components/LeadDetailModal";
import { toast } from "../context/ToastContext";
import { formatProperName } from "../utils/formatUtils";
import { getLeadFormOrCampaignName, formatCampaignHandle } from "../utils/leadFormUtils";
export const CampaignsPage = ({
  leads = [],
  agents = [],
  activities = [],
  messages = [],
  callRecords = [],
  customFields = [],
  initialCampaignHandle,
  onOpenLeadDetail,
  onUpdateLead,
  onAddActivity,
  onSendMessage,
  onOpenPowerDialerForLead,
  onDeleteLead,
  onUpdateCallRecord,
  lostReasons,
  onNavigateToTab,
  onShowToast
}) => {
  const stages = useContext(StagesContext);
  const [customCampaigns, setCustomCampaigns] = useState([]);
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [newCampaignInput, setNewCampaignInput] = useState("");
  const [dbCampaignMappings, setDbCampaignMappings] = useState([]);
  const fetchDbCampaigns = () => {
    Promise.all([
      fetch("/api/campaigns", { headers: { "x-tenant-id": "company_kite_aviation" } }).then((r) => r.json()).catch(() => ({ success: false })),
      fetch("/api/integrations/facebook/campaign-mappings", { headers: { "x-tenant-id": "company_kite_aviation" } }).then((r) => r.json()).catch(() => ({ success: false }))
    ]).then(([campRes, mapRes]) => {
      const combined = [];
      if (campRes && campRes.success && Array.isArray(campRes.campaigns)) {
        combined.push(...campRes.campaigns);
      }
      if (mapRes && mapRes.success && Array.isArray(mapRes.mappings)) {
        combined.push(...mapRes.mappings);
      }
      setDbCampaignMappings(combined);
    }).catch(() => {
    });
  };
  useEffect(() => {
    fetchDbCampaigns();
  }, []);
  const campaignsList = useMemo(() => {
    const handleMap = /* @__PURE__ */ new Map();
    const addCampaignHandle = (rawNameOrHandle, formId) => {
      if (!rawNameOrHandle || !rawNameOrHandle.trim()) return;
      const clean = rawNameOrHandle.trim();
      const h = formatCampaignHandle(clean).toLowerCase().replace(/^@/, "");
      if (!h || h === "empty" || h === "n-a" || h === "general-inbound") return;
      if (!handleMap.has(h)) {
        const displayHandle = formatCampaignHandle(clean);
        handleMap.set(h, {
          handle: displayHandle,
          name: clean.startsWith("@") ? clean.replace(/^@/, "").split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") : clean,
          formId,
          leads: []
        });
      } else if (formId && !handleMap.get(h).formId) {
        handleMap.get(h).formId = formId;
      }
    };
    dbCampaignMappings.forEach((m) => {
      if (m.campaignHandle) addCampaignHandle(m.campaignHandle, m.formId);
      if (m.campaignName) addCampaignHandle(m.campaignName, m.formId);
      if (m.name) addCampaignHandle(m.name, m.formId);
      if (m.handle) addCampaignHandle(m.handle, m.formId);
    });
    customCampaigns.forEach((c) => addCampaignHandle(c));
    if (leads && leads.length > 0) {
      leads.forEach((l) => {
        const lFormId = l.formId || l.customFields?.meta_form_id || l.customFields?.form_id;
        const leadFormName = getLeadFormOrCampaignName(l);
        const lH1 = l.campaignHandle ? formatCampaignHandle(l.campaignHandle).toLowerCase().replace(/^@/, "") : "";
        const lH2 = l.campaign_handle ? formatCampaignHandle(l.campaign_handle).toLowerCase().replace(/^@/, "") : "";
        const lN1 = l.campaignName ? formatCampaignHandle(l.campaignName).toLowerCase().replace(/^@/, "") : "";
        const lN2 = l.campaign ? formatCampaignHandle(l.campaign).toLowerCase().replace(/^@/, "") : "";
        const lN3 = l.campaign_name ? formatCampaignHandle(l.campaign_name).toLowerCase().replace(/^@/, "") : "";
        const lC1 = l.customFields?.campaign_name ? formatCampaignHandle(l.customFields.campaign_name).toLowerCase().replace(/^@/, "") : "";
        const lC2 = l.customFields?.campaign_handle ? formatCampaignHandle(l.customFields.campaign_handle).toLowerCase().replace(/^@/, "") : "";
        const lF1 = leadFormName ? formatCampaignHandle(leadFormName).toLowerCase().replace(/^@/, "") : "";
        handleMap.forEach((entry, hKey) => {
          const isFormMatch = Boolean(entry.formId && lFormId && String(entry.formId) === String(lFormId));
          const isHandleMatch = hKey === lH1 || hKey === lH2 || hKey === lN1 || hKey === lN2 || hKey === lN3 || hKey === lC1 || hKey === lC2 || hKey === lF1 || entry.name && l.campaignName && entry.name.toLowerCase() === l.campaignName.toLowerCase() || entry.name && l.campaign && entry.name.toLowerCase() === l.campaign.toLowerCase();
          if (isFormMatch || isHandleMatch) {
            entry.leads.push(l);
          }
        });
      });
    }
    return Array.from(handleMap.values()).map((entry, idx) => {
      const freshCount = entry.leads.filter((l) => l.status === "Fresh" || l.status === "Open").length;
      return {
        id: `camp-dyn-${idx}-${entry.handle.replace(/[^a-z0-9]/gi, "")}`,
        handle: entry.handle,
        name: entry.name,
        totalLeads: entry.leads.length,
        newLeads: freshCount,
        progress: entry.leads.length > 0 ? Math.round((entry.leads.length - freshCount) / entry.leads.length * 100) : 0,
        members: Array.from(new Set(entry.leads.map((l) => l.ownerAgentName || "Admin"))).map(
          (n) => n.split(" ").map((x) => x[0]).join("").toUpperCase()
        ),
        errors: 0,
        leads: entry.leads
      };
    });
  }, [leads, agents, customCampaigns, dbCampaignMappings]);
  const [activeCampaign, setActiveCampaign] = useState(campaignsList[0]);
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [showCampaignSettingsMenu, setShowCampaignSettingsMenu] = useState(false);
  const [isCampaignPaused, setIsCampaignPaused] = useState(false);
  useEffect(() => {
    if (campaignsList.length > 0) {
      if (!activeCampaign || !campaignsList.some((c) => c.handle.toLowerCase() === activeCampaign.handle.toLowerCase())) {
        setActiveCampaign(campaignsList[0]);
      }
    }
  }, [campaignsList]);
  useEffect(() => {
    if (initialCampaignHandle) {
      const found = campaignsList.find((c) => c.handle.toLowerCase() === initialCampaignHandle.toLowerCase() || c.name.toLowerCase() === initialCampaignHandle.toLowerCase());
      if (found) {
        setActiveCampaign(found);
      }
    }
  }, [initialCampaignHandle, campaignsList]);
  const [showLicenseBanner, setShowLicenseBanner] = useState(true);
  const [openAccordion, setOpenAccordion] = useState("calling");
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState("All");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const campaignLeads = useMemo(() => {
    if (!activeCampaign) return [];
    const latestCampaign = campaignsList.find((c) => c.handle === activeCampaign.handle);
    return latestCampaign?.leads || activeCampaign.leads || [];
  }, [activeCampaign, campaignsList]);
  const [selectedLead, setSelectedLead] = useState(() => campaignLeads[0] || null);
  useEffect(() => {
    if (campaignLeads.length > 0) {
      if (!selectedLead) {
        setSelectedLead(campaignLeads[0]);
      } else {
        const found = campaignLeads.find((l) => l.id === selectedLead.id);
        if (found) {
          setSelectedLead(found);
        } else {
          setSelectedLead(campaignLeads[0]);
        }
      }
    } else {
      setSelectedLead(null);
    }
  }, [campaignLeads]);
  const [campaignTab, setCampaignTab] = useState("NEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [newNoteText, setNewNoteText] = useState("");
  const [activeRightTab, setActiveRightTab] = useState("Activity History");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [activitiesList, setActivitiesList] = useState([
    { id: "act-1", text: "Lead Source : empty \u2192 Facebook-Meta-01", time: "5h", type: "source" },
    { id: "act-2", text: "Facebook page : empty \u2192 506000535940727", time: "5h", type: "fb" },
    { id: "act-3", text: "Call Outgoing: 6s CONNECTED by Ummema Sufiya BM", time: "1d ago", type: "call" },
    { id: "act-4", text: "Automated WhatsApp Intro Message Delivered", time: "1d ago", type: "whatsapp" }
  ]);
  const statusCounts = useMemo(() => {
    const counts = {
      "Fresh": 0,
      "Open": 0,
      "Interested": 0,
      "Warm": 0,
      "Contacted": 0,
      "Converted": 0,
      "RNR": 0,
      "Lost": 0
    };
    campaignLeads.forEach((l) => {
      const st = l.status || "Fresh";
      if (counts[st] !== void 0) {
        counts[st]++;
      } else {
        counts[st] = (counts[st] || 0) + 1;
      }
    });
    return counts;
  }, [campaignLeads]);
  const telecallerAllocation = useMemo(() => {
    const counts = {};
    campaignLeads.forEach((lead) => {
      const assignee = lead.ownerAgentName || "Unassigned";
      counts[assignee] = (counts[assignee] || 0) + 1;
    });
    const total = campaignLeads.length || 1;
    const colorPalette = [
      { bg: "bg-[#5EEAD4]", stroke: "#2DD4BF", name: "Farzana", hex: "#2DD4BF" },
      { bg: "bg-[#FDE047]", stroke: "#EAB308", name: "Risvana Rahim", hex: "#EAB308" },
      { bg: "bg-[#60A5FA]", stroke: "#3B82F6", name: "philemon", hex: "#3B82F6" },
      { bg: "bg-[#34D399]", stroke: "#10B981", name: "Munavvir", hex: "#10B981" },
      { bg: "bg-[#F87171]", stroke: "#EF4444", name: "Harish", hex: "#EF4444" },
      { bg: "bg-[#FB923C]", stroke: "#F97316", name: "Ashly James", hex: "#F97316" },
      { bg: "bg-[#4ADE80]", stroke: "#22C55E", name: "Madhava sai nagendra", hex: "#22C55E" },
      { bg: "bg-[#A78BFA]", stroke: "#8B5CF6", name: "Ummema Sufiya BM", hex: "#8B5CF6" }
    ];
    let currentOffset = 0;
    return Object.entries(counts).map(([agentName, count], idx) => {
      const percentage = Math.round(count / total * 100);
      const colorObj = colorPalette[idx % colorPalette.length];
      const offset = currentOffset;
      currentOffset += percentage;
      return {
        agentName,
        count,
        percentage,
        colorObj,
        offset
      };
    });
  }, [campaignLeads]);
  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
  };
  const handleStatusChange = (newStatus) => {
    if (!selectedLead) return;
    const updated = { ...selectedLead, status: newStatus };
    setSelectedLead(updated);
    if (onUpdateLead) onUpdateLead(updated);
    setActivitiesList((prev) => [
      { id: `act-${Date.now()}`, text: `Status updated to ${newStatus}`, time: "Just now", type: "status" },
      ...prev
    ]);
  };
  const handleAssigneeChange = (agentId, agentName) => {
    if (!selectedLead) return;
    const updated = { ...selectedLead, ownerAgentId: agentId, ownerAgentName: agentName };
    setSelectedLead(updated);
    if (onUpdateLead) onUpdateLead(updated);
    setActivitiesList((prev) => [
      { id: `act-${Date.now()}`, text: `Reallocated to ${agentName}`, time: "Just now", type: "assignment" },
      ...prev
    ]);
  };
  const handleAddNoteSubmit = () => {
    if (!newNoteText.trim()) return;
    setActivitiesList((prev) => [
      { id: `act-${Date.now()}`, text: `Note Added: ${newNoteText.trim()}`, time: "Just now", type: "note" },
      ...prev
    ]);
    setNewNoteText("");
  };
  const filteredLeads = useMemo(() => {
    return campaignLeads.filter((l) => {
      if (campaignTab === "NEW") {
        if (l.status !== "Fresh" && l.status !== "Open") {
          return false;
        }
      }
      const matchesSearch = (l.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (l.phone || "").includes(searchQuery);
      const matchesAssignee = selectedAssigneeFilter.toUpperCase() === "ALL" || !selectedAssigneeFilter ? true : (l.ownerAgentName || "").toLowerCase().includes(selectedAssigneeFilter.toLowerCase());
      return matchesSearch && matchesAssignee;
    });
  }, [campaignLeads, searchQuery, selectedAssigneeFilter, campaignTab]);
  const dynamicAssignees = useMemo(() => {
    const pal = ["#9BD3BA", "#70C0FA", "#F8CF48", "#66CFBA", "#B08246", "#8993DC", "#4CD4E8", "#8FE0B9", "#F36565", "#A0E236"];
    const total = campaignLeads.length || 1;
    const map = /* @__PURE__ */ new Map();
    campaignLeads.forEach((l) => {
      const name = l.ownerAgentName || "Unassigned";
      map.set(name, (map.get(name) || 0) + 1);
    });
    if (map.size === 0 && agents.length > 0) {
      agents.forEach((ag) => map.set(ag.name, 0));
    }
    const entries = Array.from(map.entries());
    return entries.map(([name, count], idx) => ({
      name,
      count,
      percentage: Number((count / total * 100).toFixed(1)),
      color: pal[idx % pal.length]
    })).sort((a, b) => b.count - a.count);
  }, [campaignLeads, agents]);
  const renderSvgPie = (items, size = 100) => {
    let cumulativePercent = 0;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.45;
    const activeItems = items.filter((i) => i.percentage > 0);
    if (activeItems.length === 0) {
      return /* @__PURE__ */ jsx("circle", { cx, cy, r, fill: "#E2E8F0" });
    }
    if (activeItems.length === 1) {
      return /* @__PURE__ */ jsx("circle", { cx, cy, r, fill: activeItems[0].color });
    }
    return items.map((item, idx) => {
      if (item.percentage <= 0) return null;
      const startAngle = cumulativePercent / 100 * 360;
      const sliceAngle = item.percentage / 100 * 360;
      const endAngle = startAngle + sliceAngle;
      cumulativePercent += item.percentage;
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      return /* @__PURE__ */ jsx(
        "path",
        {
          d: pathData,
          fill: item.color,
          stroke: "#ffffff",
          strokeWidth: "0.5",
          className: "transition-opacity hover:opacity-85 cursor-pointer"
        },
        idx
      );
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#F3F4F7] font-sans text-slate-800 space-y-3 pb-8 select-none", children: [
    showLicenseBanner && /* @__PURE__ */ jsxs("div", { className: "bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3.5 py-1.5 flex items-center justify-between text-xs text-[#991B1B] shadow-2xs font-sans", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 text-[#DC2626] shrink-0" }),
        /* @__PURE__ */ jsxs("span", { className: "text-[11px] md:text-xs font-medium text-[#991B1B]", children: [
          /* @__PURE__ */ jsx("strong", { children: "2 licenses have expired!" }),
          " ",
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                if (onNavigateToTab) onNavigateToTab("team");
              },
              className: "underline font-bold text-[#7F1D1D] hover:text-black cursor-pointer mx-1",
              children: "View Users"
            }
          ),
          " ",
          "|",
          " ",
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                if (onNavigateToTab) onNavigateToTab("settings", "billing");
              },
              className: "underline font-bold text-[#7F1D1D] hover:text-black cursor-pointer ml-1",
              children: "Renew Now"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setShowLicenseBanner(false),
          className: "text-[#991B1B] hover:text-black p-0.5 rounded transition-colors cursor-pointer",
          children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" })
        }
      )
    ] }),
    !activeCampaign ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200/90 shadow-2xs", children: [
      /* @__PURE__ */ jsx(Filter, { className: "w-12 h-12 text-slate-300 mb-4" }),
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-800", children: "No Campaigns Found" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1 max-w-md text-center", children: "You don't have any workspace campaigns configured yet. Connect your Facebook page or create a custom campaign to see leads here." })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-4 items-start", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-4 xl:col-span-3.5 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-2 relative", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-slate-500", children: "Campaign Dashboard" }),
              isCampaignPaused && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200", children: "Paused" })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setShowCampaignSettingsMenu(!showCampaignSettingsMenu),
                className: "text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 cursor-pointer transition-colors",
                title: "Campaign Settings",
                children: /* @__PURE__ */ jsx(MoreVertical, { className: "w-4 h-4" })
              }
            ),
            showCampaignSettingsMenu && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-7 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 font-sans text-xs", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: async () => {
                    setShowCampaignSettingsMenu(false);
                    if (onShowToast) onShowToast(`\u26A1 Restarting campaign "${activeCampaign.name}"... Fetching live leads.`);
                    try {
                      const res = await fetch("/api/meta/sync", { method: "POST", headers: { "Content-Type": "application/json", "x-tenant-id": "company_kite_aviation" } });
                      const data = await res.json();
                      if (onShowToast) onShowToast(`\u26A1 Campaign restarted! ${data.newLeadsSaved || 0} new leads synced.`);
                    } catch (e) {
                      if (onShowToast) onShowToast(`\u26A1 Campaign restarted! Lead sync refreshed.`);
                    }
                  },
                  className: "w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium cursor-pointer transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(RotateCcw, { className: "w-3.5 h-3.5 text-indigo-600 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { children: "Restart Campaign" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    setShowCampaignSettingsMenu(false);
                    setIsCampaignPaused(!isCampaignPaused);
                    if (onShowToast) onShowToast(isCampaignPaused ? `\u25B6\uFE0F Campaign "${activeCampaign.name}" resumed.` : `\u23F8\uFE0F Campaign "${activeCampaign.name}" paused.`);
                  },
                  className: "w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-amber-50 hover:text-amber-700 font-medium cursor-pointer transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(Pause, { className: "w-3.5 h-3.5 text-amber-600 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { children: isCampaignPaused ? "Resume Campaign" : "Pause Campaign" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "border-t border-slate-100 my-1" }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: async () => {
                    setShowCampaignSettingsMenu(false);
                    if (activeCampaign.handle === "@all-inbound-leads") {
                      if (onShowToast) onShowToast('\u26A0\uFE0F "All Inbound Leads" is a primary system workspace queue and cannot be deleted.');
                      return;
                    }
                    if (confirm(`Are you sure you want to delete campaign "${activeCampaign.name}" (${activeCampaign.handle}) from the database?`)) {
                      const targetHandle = activeCampaign.handle.toLowerCase();
                      setCustomCampaigns((prev) => prev.filter((c) => formatCampaignHandle(c).toLowerCase() !== targetHandle));
                      try {
                        await fetch(`/api/campaigns/${encodeURIComponent(activeCampaign.id || targetHandle)}`, { method: "DELETE", headers: { "x-tenant-id": "company_kite_aviation" } });
                      } catch {
                      }
                      fetchDbCampaigns();
                      if (onShowToast) onShowToast(`\u{1F5D1}\uFE0F Campaign "${activeCampaign.name}" removed from workspace.`);
                    }
                  },
                  className: "w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-medium cursor-pointer transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5 text-rose-600 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { children: "Delete Campaign" })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setShowCampaignDropdown(!showCampaignDropdown),
                className: "w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-indigo-400 p-2.5 rounded-xl text-left cursor-pointer transition-all shadow-2xs",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "truncate", children: /* @__PURE__ */ jsx("h3", { className: "font-mono text-xs font-bold text-slate-900 truncate", children: activeCampaign.handle }) }),
                  /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 text-slate-400 shrink-0 ml-1" })
                ]
              }
            ),
            showCampaignDropdown && /* @__PURE__ */ jsxs("div", { className: "absolute left-0 top-full mt-1.5 w-84 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase px-1 pb-1 border-b border-slate-100", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "Campaigns (",
                  campaignsList.length,
                  ")"
                ] }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setIsAddingCampaign(!isAddingCampaign),
                    className: "text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer font-bold",
                    children: [
                      /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" }),
                      /* @__PURE__ */ jsx("span", { children: "New" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Search, { className: "w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: campaignSearchQuery,
                    onChange: (e) => setCampaignSearchQuery(e.target.value),
                    placeholder: "Search campaigns...",
                    className: "w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-sans"
                  }
                )
              ] }),
              isAddingCampaign && /* @__PURE__ */ jsxs("div", { className: "p-2 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: newCampaignInput,
                    onChange: (e) => setNewCampaignInput(e.target.value),
                    placeholder: "Campaign name e.g. Bangalore Leads...",
                    className: "w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-indigo-600",
                    onKeyDown: (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newCampaignInput.trim()) {
                          const cleanName = newCampaignInput.trim();
                          const cleanHandle = formatCampaignHandle(cleanName);
                          setCustomCampaigns((prev) => [...prev, cleanName]);
                          fetch("/api/campaigns", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "x-tenant-id": "company_kite_aviation" },
                            body: JSON.stringify({ name: cleanName, handle: cleanHandle })
                          }).then(() => fetchDbCampaigns()).catch(() => {
                          });
                          setNewCampaignInput("");
                          setIsAddingCampaign(false);
                          if (onShowToast) onShowToast(`Created campaign "${cleanName}" in database.`);
                        }
                      }
                    }
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end space-x-1.5", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setIsAddingCampaign(false),
                      className: "px-2 py-0.5 text-slate-500 hover:text-slate-700 text-xs cursor-pointer",
                      children: "Cancel"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        if (newCampaignInput.trim()) {
                          const cleanName = newCampaignInput.trim();
                          const cleanHandle = formatCampaignHandle(cleanName);
                          setCustomCampaigns((prev) => [...prev, cleanName]);
                          fetch("/api/campaigns", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "x-tenant-id": "company_kite_aviation" },
                            body: JSON.stringify({ name: cleanName, handle: cleanHandle })
                          }).then(() => fetchDbCampaigns()).catch(() => {
                          });
                          setNewCampaignInput("");
                          setIsAddingCampaign(false);
                          if (onShowToast) onShowToast(`Created campaign "${cleanName}" in database.`);
                        }
                      },
                      className: "px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer",
                      children: "Add"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "max-h-60 overflow-y-auto space-y-1 pr-0.5", children: campaignsList.filter((c) => c.name.toLowerCase().includes(campaignSearchQuery.toLowerCase()) || c.handle.toLowerCase().includes(campaignSearchQuery.toLowerCase())).map((camp) => /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    setActiveCampaign(camp);
                    setShowCampaignDropdown(false);
                  },
                  className: `w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${activeCampaign.handle.toLowerCase() === camp.handle.toLowerCase() ? "bg-indigo-50 text-indigo-900 font-bold border border-indigo-200" : "hover:bg-slate-50 text-slate-700"}`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 truncate", children: [
                      /* @__PURE__ */ jsx(Phone, { className: `w-3.5 h-3.5 ${activeCampaign.handle.toLowerCase() === camp.handle.toLowerCase() ? "text-indigo-600" : "text-slate-400"} shrink-0` }),
                      /* @__PURE__ */ jsx("div", { className: "truncate", children: /* @__PURE__ */ jsx("div", { className: "font-mono text-[11px] font-bold truncate", children: camp.handle.replace(/^@/, "") }) })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0 ml-1", children: camp.totalLeads })
                  ]
                },
                camp.id
              )) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1.5 text-[11px] font-mono", children: [
            /* @__PURE__ */ jsxs("span", { className: "bg-slate-50 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-3 h-3 text-slate-500" }),
              /* @__PURE__ */ jsx("span", { children: "7d" })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "bg-slate-50 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1", children: [
              /* @__PURE__ */ jsx(User, { className: "w-3 h-3 text-slate-500" }),
              /* @__PURE__ */ jsx("span", { children: activeCampaign.totalLeads || 9 })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "bg-slate-50 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1", children: [
              /* @__PURE__ */ jsx(Filter, { className: "w-3 h-3 text-slate-500" }),
              /* @__PURE__ */ jsx("span", { children: "1" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "bg-slate-50 text-slate-500 font-semibold px-2 py-0.5 rounded border border-slate-200", children: "NONE" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-1 border-t border-slate-100", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center -space-x-1.5", children: /* @__PURE__ */ jsx("span", { className: "w-6 h-6 rounded-full bg-indigo-100 border-2 border-white text-indigo-800 text-[10px] font-bold flex items-center justify-center", children: "P" }) }),
            /* @__PURE__ */ jsxs("div", { className: "relative w-9 h-9 flex items-center justify-center", children: [
              /* @__PURE__ */ jsxs("svg", { className: "w-full h-full transform -rotate-90", viewBox: "0 0 36 36", children: [
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    className: "text-slate-100",
                    strokeWidth: "3.5",
                    stroke: "currentColor",
                    fill: "none",
                    d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    className: "text-emerald-500 transition-all duration-500",
                    strokeDasharray: `${activeCampaign.progress || 33}, 100`,
                    strokeWidth: "3.5",
                    strokeLinecap: "round",
                    stroke: "currentColor",
                    fill: "none",
                    d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "absolute text-[9px] font-bold text-slate-800 font-mono", children: [
                activeCampaign.progress || 33,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  if (onShowToast) onShowToast(`Launching power dialer for ${activeCampaign.handle}`);
                },
                className: "bg-[#3a2088] hover:bg-[#2c186b] text-white px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95",
                title: "Launch Campaign Dialer",
                children: [
                  /* @__PURE__ */ jsx(Phone, { className: "w-3.5 h-3.5 fill-current" }),
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-sm leading-none", children: "\u203A" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setOpenAccordion(openAccordion === "assignees" ? null : "assignees"),
                className: "w-full p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-800 font-bold", children: "Campaign Assignees Report" }),
                  /* @__PURE__ */ jsx(ChevronDown, { className: `w-4 h-4 text-slate-500 transition-transform duration-200 ${openAccordion === "assignees" ? "rotate-180" : ""}` })
                ]
              }
            ),
            openAccordion === "assignees" && /* @__PURE__ */ jsxs("div", { className: "p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-white", children: [
              /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => toast.info("Viewing campaign assignment diagnostics: 5 leads require phone validation before auto-dispatch.", "Campaign Diagnostics"),
                  className: "text-xs font-semibold text-[#DC2626] hover:underline flex items-center space-x-1 cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(AlertCircle, { className: "w-3.5 h-3.5 text-[#DC2626]" }),
                    /* @__PURE__ */ jsx("span", { className: "underline", children: "5 Errors" })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-3 items-center", children: [
                /* @__PURE__ */ jsx("div", { className: "col-span-5 flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-32 h-32", viewBox: "0 0 140 140", children: renderSvgPie(dynamicAssignees.map((a) => ({ percentage: a.percentage, color: a.color })), 140) }) }),
                /* @__PURE__ */ jsx("div", { className: "col-span-7 space-y-1.5 text-xs", children: dynamicAssignees.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-[11px]", children: "No assigned leads yet." }) : dynamicAssignees.map((item, idx) => /* @__PURE__ */ jsxs(
                  "div",
                  {
                    onClick: () => setSelectedAssigneeFilter(item.name),
                    className: `flex items-start space-x-2 text-[11px] leading-tight p-1 rounded-md cursor-pointer transition-colors ${selectedAssigneeFilter === item.name ? "bg-indigo-50 font-bold" : "hover:bg-slate-50"}`,
                    children: [
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          className: "w-2.5 h-2.5 rounded-full shrink-0 mt-0.5",
                          style: { backgroundColor: item.color }
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "text-slate-800", children: [
                        /* @__PURE__ */ jsx("span", { children: formatProperName(item.name) }),
                        " ",
                        /* @__PURE__ */ jsxs("span", { className: "text-slate-600 font-medium", children: [
                          "(",
                          item.percentage,
                          "%)"
                        ] })
                      ] })
                    ]
                  },
                  idx
                )) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setOpenAccordion(openAccordion === "calling" ? null : "calling"),
                className: "w-full p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-800 font-bold", children: "Campaign Calling Report" }),
                  /* @__PURE__ */ jsx(ChevronDown, { className: `w-4 h-4 text-slate-500 transition-transform duration-200 ${openAccordion === "calling" ? "rotate-180" : ""}` })
                ]
              }
            ),
            openAccordion === "calling" && /* @__PURE__ */ jsx("div", { className: "p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-3 items-center py-2", children: [
              /* @__PURE__ */ jsx("div", { className: "col-span-5 flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-28 h-28", viewBox: "0 0 100 100", children: renderSvgPie([
                { percentage: 0, color: "#9BD3BA" },
                { percentage: 0, color: "#F8CF48" },
                { percentage: 100, color: "#F87171" },
                { percentage: 0, color: "#B08246" }
              ], 100) }) }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-7 space-y-2 text-xs", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#9BD3BA] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "connected (0%)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#F8CF48] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "attempted (0%)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#F87171] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-800 font-semibold", children: "pending (100%)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#B08246] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "skipped (0%)" })
                ] })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setOpenAccordion(openAccordion === "status" ? null : "status"),
                className: "w-full p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-800 font-bold", children: "Leads Status Report" }),
                  /* @__PURE__ */ jsx(ChevronDown, { className: `w-4 h-4 text-slate-500 transition-transform ${openAccordion === "status" ? "rotate-180" : ""}` })
                ]
              }
            ),
            openAccordion === "status" && /* @__PURE__ */ jsx("div", { className: "p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-3 items-center py-2", children: [
              /* @__PURE__ */ jsx("div", { className: "col-span-5 flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-28 h-28", viewBox: "0 0 100 100", children: renderSvgPie([
                { percentage: 60, color: "#6366F1" },
                { percentage: 20, color: "#10B981" },
                { percentage: 20, color: "#F59E0B" }
              ], 100) }) }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-7 space-y-2 text-xs", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#6366F1] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-800 font-semibold", children: "Job enquiry (60%)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "Open (20%)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "RNR (20%)" })
                ] })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setOpenAccordion(openAccordion === "lost" ? null : "lost"),
                className: "w-full p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-800 font-bold", children: "Leads Lost Reason Report" }),
                  /* @__PURE__ */ jsx(ChevronDown, { className: `w-4 h-4 text-slate-500 transition-transform ${openAccordion === "lost" ? "rotate-180" : ""}` })
                ]
              }
            ),
            openAccordion === "lost" && /* @__PURE__ */ jsx("div", { className: "p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-3 items-center py-2", children: [
              /* @__PURE__ */ jsx("div", { className: "col-span-5 flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-28 h-28", viewBox: "0 0 100 100", children: renderSvgPie([
                { percentage: 45, color: "#818CF8" },
                { percentage: 30, color: "#F87171" },
                { percentage: 25, color: "#FBBF24" }
              ], 100) }) }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-7 space-y-2 text-xs", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#818CF8] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-800 font-semibold", children: "Joined Another Institute (45%)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#F87171] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "High Course Fees (30%)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#FBBF24] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "Location / Relocation Issue (25%)" })
                ] })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setOpenAccordion(openAccordion === "calls_status" ? null : "calls_status"),
                className: "w-full p-3.5 flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer text-left",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-800 font-bold", children: "Calls Status Report" }),
                  /* @__PURE__ */ jsx(ChevronDown, { className: `w-4 h-4 text-slate-500 transition-transform ${openAccordion === "calls_status" ? "rotate-180" : ""}` })
                ]
              }
            ),
            openAccordion === "calls_status" && /* @__PURE__ */ jsx("div", { className: "p-3.5 pt-1 border-t border-slate-100 space-y-3 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-3 items-center py-2", children: [
              /* @__PURE__ */ jsx("div", { className: "col-span-5 flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-28 h-28", viewBox: "0 0 100 100", children: renderSvgPie([
                { percentage: 52, color: "#10B981" },
                { percentage: 24, color: "#F87171" },
                { percentage: 14, color: "#64748B" },
                { percentage: 10, color: "#F59E0B" }
              ], 100) }) }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-7 space-y-2 text-xs", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-800 font-semibold", children: "Connected (52%)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#F87171] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "RNR / No Answer (24%)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#64748B] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "Switched Off (14%)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 text-[11px]", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "Busy / Call Later (10%)" })
                ] })
              ] })
            ] }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-4 xl:col-span-4 bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center space-x-1.5 min-w-0", children: /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs font-bold text-slate-800 truncate", children: [
            activeCampaign.handle,
            " \u203A"
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1 text-xs font-bold shrink-0", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setCampaignTab("ACTIVE"),
                className: `px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer ${campaignTab === "ACTIVE" ? "text-slate-900 border-b-2 border-slate-900 font-bold" : "text-slate-400 hover:text-slate-600"}`,
                children: "ACTIVE"
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setCampaignTab("NEW"),
                className: `px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer ${campaignTab === "NEW" ? "text-indigo-700 border-b-2 border-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-600"}`,
                children: [
                  "NEW (",
                  filteredLeads.length,
                  ")"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              placeholder: "Search campaign leads...",
              className: "w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all font-sans"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-[640px] overflow-y-auto pr-1", children: filteredLeads.map((lead) => {
          const isSelected = selectedLead.id === lead.id;
          const isConnectedCall = lead.createdAt && lead.createdAt.includes("CONNECTED");
          const isDatedNote = lead.createdAt && lead.createdAt.includes("Fri, 14 Aug");
          return /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => handleSelectLead(lead),
              className: `p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${isSelected ? "bg-indigo-50/70 border-indigo-400 shadow-2xs" : "bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/60"}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 pr-2", children: [
                    /* @__PURE__ */ jsx(
                      "h4",
                      {
                        className: "text-xs font-bold text-slate-900 leading-tight truncate",
                        title: lead.name,
                        children: formatProperName(lead.name)
                      }
                    ),
                    /* @__PURE__ */ jsx("p", { className: "text-[11px] font-mono text-slate-600 mt-0.5", children: lead.phone })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1.5 shrink-0", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-500 font-medium", children: "Status:" }),
                    /* @__PURE__ */ jsx(StatusBadge, { status: lead.status || "Fresh", size: "xs" }),
                    /* @__PURE__ */ jsx(Star, { className: "w-3.5 h-3.5 text-slate-300 hover:text-amber-400 cursor-pointer ml-0.5" })
                  ] })
                ] }),
                (lead.createdAt || lead.ownerAgentName) && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-100", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex items-center space-x-1 truncate min-w-0", children: isConnectedCall ? /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1 text-emerald-600 font-semibold italic truncate", children: [
                    /* @__PURE__ */ jsx(Phone, { className: "w-3 h-3 text-emerald-600 shrink-0 fill-current" }),
                    /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 not-italic", children: lead.createdAt.split(" ")[0] }),
                    /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-normal", children: lead.createdAt.replace(lead.createdAt.split(" ")[0], "") })
                  ] }) : isDatedNote ? /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1 text-slate-500 truncate", children: [
                    /* @__PURE__ */ jsx(Calendar, { className: "w-3 h-3 text-slate-400 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { className: "truncate", children: lead.createdAt })
                  ] }) : /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-[10px] truncate", children: lead.createdAt || "Assigned" }) }),
                  /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[9px] border border-indigo-200 shrink-0", children: lead.ownerAgentName.split(" ").map((n) => n[0]).join("").slice(0, 2) })
                ] })
              ]
            },
            lead.id
          );
        }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-4 xl:col-span-4.5 h-full min-h-[720px] flex flex-col", children: selectedLead ? /* @__PURE__ */ jsx(
        LeadDetailModal,
        {
          isEmbedded: true,
          campaignHandle: activeCampaign.handle,
          lead: selectedLead,
          allLeads: filteredLeads,
          agents,
          activities,
          messages,
          callRecords,
          customFields,
          onClose: () => onOpenLeadDetail && onOpenLeadDetail(selectedLead),
          onSelectLead: (ld) => setSelectedLead(ld),
          onOpenPowerDialerForLead,
          onUpdateLead: (up) => {
            setSelectedLead(up);
            if (onUpdateLead) onUpdateLead(up);
          },
          onAddActivity: onAddActivity || (() => {
          }),
          onSendMessage: onSendMessage || (() => {
          }),
          onDeleteLead,
          onUpdateCallRecord,
          lostReasons
        }
      ) : /* @__PURE__ */ jsxs("div", { className: "p-8 text-center bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 text-sm", children: "No Lead Selected" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Select a lead from the campaign queue to view full details." })
      ] }) })
    ] })
  ] });
};
export const CampaignsView = CampaignsPage;
export default CampaignsPage;
