import React, { useState } from "react";
import { Campaign } from "../types";
import { BarChart3, Plus, Sparkles, Send, Megaphone, ArrowUpRight, DollarSign, Eye, MousePointer, ShieldCheck } from "lucide-react";

interface CampaignCenterProps {
  campaigns: Campaign[];
  onAddCampaign: (campaign: Omit<Campaign, "id" | "leadsCount" | "conversions" | "clicks" | "impressions">) => void;
  userRole: string; // permissions gating
  formatCurrency?: (value: number) => string;
  selectedCurrency?: string;
}

export default function CampaignCenter({ campaigns, onAddCampaign, userRole, formatCurrency, selectedCurrency = "USD" }: CampaignCenterProps) {
  const format = (v: number) => {
    if (formatCurrency) return formatCurrency(v);
    return `$${v.toLocaleString()}`;
  };

  // Input fields for campaign builder
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [budget, setBudget] = useState(10000);
  const [spent, setSpent] = useState(1500);
  const [status, setStatus] = useState<"Active" | "Planned" | "Completed">("Active");
  const [showForm, setShowForm] = useState(false);

  // Local state for interactive sandbox ROI planner
  const [planCPA, setPlanCPA] = useState<number>(350); // Dollars per acquire
  const [planAdSpend, setPlanAdSpend] = useState<number>(12000);
  const [planLTV, setPlanLTV] = useState<number>(2400);

  // Model ROI planner
  const planEstAcquired = planCPA > 0 ? planAdSpend / planCPA : 0;
  const planRevenueProj = planEstAcquired * planLTV;
  const planNetProfit = planRevenueProj - planAdSpend;
  const planROI = planAdSpend > 0 ? (planNetProfit / planAdSpend) * 100 : 0;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddCampaign({
      name,
      description: desc,
      budget,
      spent,
      status,
      dateStarted: new Date().toISOString().split("T")[0]
    });
    // Reset Form
    setName("");
    setDesc("");
    setBudget(10000);
    setSpent(1500);
    setStatus("Active");
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Campaign Hub Summary banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1F1830] p-5 rounded-2xl border border-white/5 gap-4">
        <div>
          <h2 className="text-lg font-bold font-display text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#C084FC]" /> Marketing Campaigns Hub
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Manage advertisement allocation budgets, monitor performance KPIs, and calculate estimated ROI loops.
          </p>
        </div>
        
        {userRole !== "Sales Agent" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#A855F7] hover:to-[#C084FC] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 shadow-md shadow-[#7C3AED]/20 hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" /> Add Campaign Account
          </button>
        )}
      </div>

      {/* Dynamic Drawer Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#1F1830] border border-[#7C3AED]/35 p-6 rounded-2xl space-y-4 shadow-xl relative animate-in fade-in duration-300">
          <h4 className="text-xs font-mono uppercase tracking-wider text-[#C084FC] font-bold">New Campaign Credentials</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-mono">Campaign Title</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 LinkedIn Partner Program"
                className="w-full bg-[#0D0B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-mono">Target Channel Strategy</label>
              <input
                type="text"
                required
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Brief summary profile notes"
                className="w-full bg-[#0D0B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-mono">Budget Allocated ({selectedCurrency})</label>
              <input
                type="number"
                required
                value={budget}
                onChange={(e) => setBudget(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#0D0B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-mono">Starting Expense Spent ({selectedCurrency})</label>
              <input
                type="number"
                required
                value={spent}
                onChange={(e) => setSpent(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#0D0B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white rounded-xl text-xs font-semibold"
            >
              Construct Campaign
            </button>
          </div>
        </form>
      )}

      {/* Grid: Campaigns List & ROI modeling planner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Campaigns list column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => {
              const capPct = Math.round((camp.spent / camp.budget) * 100);
              const costPerLead = camp.leadsCount > 0 ? Math.round(camp.spent / camp.leadsCount) : 0;
              const isOverspent = capPct > 80;

              return (
                <div key={camp.id} className="bg-[#1F1830] border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-[#7C3AED]/20 transition-all duration-300">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                        camp.status === "Active" 
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" 
                          : camp.status === "Completed"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                      }`}>
                        {camp.status}
                      </span>
                      <span className="font-mono text-[9.5px] text-[#94A3B8]">{camp.dateStarted}</span>
                    </div>

                    <h3 className="font-display font-semibold text-sm text-[#F8FAFC]">{camp.name}</h3>
                    <p className="text-[11px] text-[#94A3B8] leading-normal">{camp.description}</p>
                  </div>

                  {/* Financials details */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-400">Yield conversion cost (CPL)</span>
                      <strong className="text-white font-mono">{format(costPerLead)} CPL</strong>
                    </div>

                    {/* Progress spent line */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-gray-400 font-sans">Budget exhaustion</span>
                        <span className={isOverspent ? "text-rose-400" : "text-[#C084FC]"}>
                          {format(camp.spent)} / {format(camp.budget)} ({capPct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0D0B14] rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-300`}
                          style={{ 
                            width: `${Math.min(100, capPct)}%`,
                            backgroundColor: isOverspent ? "#EF4444" : "#7C3AED"
                          }}
                        />
                      </div>
                    </div>

                    {/* Leads generated stats */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-center pt-1.5 bg-[#0D0B14]/40 p-2 rounded-xl">
                      <div>
                        <span className="text-gray-400 block">Sourced Leads</span>
                        <strong className="text-white font-display text-xs">{camp.leadsCount || 0}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Client Wins</span>
                        <strong className="text-emerald-400 font-display text-xs">{camp.conversions || 0}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic ROI planner tool card */}
        <div className="lg:col-span-4 bg-[#1F1830] border border-white/5 rounded-2xl p-6 space-y-5 shadow-xl h-fit">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
            <DollarSign className="text-[#C084FC] w-4 h-4" />
            <h3 className="font-display font-semibold text-xs text-white uppercase tracking-wider">Predictive ROI Sandbox</h3>
          </div>

          <p className="text-[11.5px] text-[#94A3B8] leading-normal">
            Model anticipated conversion values and pipeline payback horizons. Adjust estimated acquisition values to simulate profit metrics.
          </p>

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-gray-400">Ad Allocation spent:</span>
                <span className="text-[#C084FC] font-semibold">{format(planAdSpend)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={planAdSpend}
                onChange={(e) => setPlanAdSpend(parseInt(e.target.value))}
                className="w-full h-1 bg-[#0d0b14] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-gray-400 font-sans">Acquisition Costs (CPA):</span>
                <span className="text-[#C084FC] font-semibold">{format(planCPA)}</span>
              </div>
              <input
                type="range"
                min="100"
                max="1500"
                step="50"
                value={planCPA}
                onChange={(e) => setPlanCPA(parseInt(e.target.value))}
                className="w-full h-1 bg-[#0d0b14] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-gray-400">Average Client LTV value:</span>
                <span className="text-[#C084FC] font-semibold">{format(planLTV)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="10000"
                step="250"
                value={planLTV}
                onChange={(e) => setPlanLTV(parseInt(e.target.value))}
                className="w-full h-1 bg-[#0d0b14] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
              />
            </div>
          </div>

          {/* Planned outputs */}
          <div className="bg-[#0D0B14]/90 p-4 rounded-xl border border-white/5 space-y-3 font-mono text-[10px]">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Estimated Clients Acquired:</span>
              <span className="text-white font-medium">{planEstAcquired.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Proj. Receipts:</span>
              <span className="text-white font-semibold">{format(Math.round(planRevenueProj))}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
              <span className="text-gray-200">Ad Return Ratio (ROI):</span>
              <span className={`font-bold ${planROI >= 100 ? "text-emerald-400" : "text-amber-500"}`}>
                {planROI.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-[#7C3AED]/5 border border-[#7C3AED]/20 p-2.5 rounded-xl text-[10px] text-gray-400 leading-normal">
            <ShieldCheck className="w-4 h-4 text-[#C084FC] shrink-0" />
            <span>ROI calculates as ((Net Income) / (Ad Expense)) * 100. This acts as decision support profiling.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
