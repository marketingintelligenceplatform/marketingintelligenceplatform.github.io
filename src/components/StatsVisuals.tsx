import React, { useState } from "react";
import { FunnelStage, LeadSource, Lead } from "../types";
import { BarChart3, TrendingUp, Compass, Flame, Users, Landmark } from "lucide-react";

interface StatsVisualsProps {
  leads: Lead[];
}

export function SalesFunnelWidget({ leads }: StatsVisualsProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  // Group leads count by stages
  const stageCounts = Object.values(FunnelStage).reduce((acc, stage) => {
    acc[stage] = leads.filter((l) => l.stage === stage).length;
    return acc;
  }, {} as Record<FunnelStage, number>);

  // Define logical stage volumes with sequential funnel conversions
  // To show a realistic waterfall, we define a waterfall base
  const stageData = [
    { stage: FunnelStage.NEW_LEAD, count: leads.length, displayCount: leads.length, pct: 100, color: "#C084FC" },
    { stage: FunnelStage.CONTACTED, count: leads.filter(l => l.stage !== FunnelStage.NEW_LEAD).length, displayCount:  leads.filter(l => l.stage !== FunnelStage.NEW_LEAD).length, pct: 85, color: "#A855F7" },
    { stage: FunnelStage.QUALIFIED, count: leads.filter(l => ![FunnelStage.NEW_LEAD, FunnelStage.CONTACTED].includes(l.stage)).length, displayCount: leads.filter(l => l.stage === FunnelStage.QUALIFIED).length, pct: 60, color: "#8B5CF6" },
    { stage: FunnelStage.PROPOSAL_SENT, count: leads.filter(l => [FunnelStage.PROPOSAL_SENT, FunnelStage.NEGOTIATION, FunnelStage.WON].includes(l.stage)).length, displayCount: leads.filter(l => l.stage === FunnelStage.PROPOSAL_SENT).length, pct: 45, color: "#7C3AED" },
    { stage: FunnelStage.NEGOTIATION, count: leads.filter(l => [FunnelStage.NEGOTIATION, FunnelStage.WON].includes(l.stage)).length, displayCount: leads.filter(l => l.stage === FunnelStage.NEGOTIATION).length, pct: 30, color: "#6D28D9" },
    { stage: FunnelStage.WON, count: leads.filter(l => l.stage === FunnelStage.WON).length, displayCount: leads.filter(l => l.stage === FunnelStage.WON).length, pct: 14.2, color: "#10B981" },
  ];

  return (
    <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Flame className="w-4 h-4 text-[#C084FC]" />
          <h3 className="font-display font-semibold text-xs text-[#F8FAFC]">Funnel Conversion Pipeline</h3>
        </div>
        <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-[#94A3B8]">Waterflow Waterfall</span>
      </div>

      <div className="space-y-2.5 pt-1">
        {stageData.map((item, index) => {
          const isHovered = hoveredStage === item.stage;
          return (
            <div 
              key={item.stage}
              className="space-y-1 group cursor-pointer"
              onMouseEnter={() => setHoveredStage(item.stage)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              <div className="flex justify-between items-center text-xs">
                <span className={`font-medium transition-colors duration-200 ${isHovered ? "text-[#C084FC]" : "text-gray-300"}`}>
                  {item.stage}
                </span>
                <div className="flex items-center space-x-2 font-mono text-[10px]">
                  <span className="text-[#94A3B8]">{item.displayCount} at stage</span>
                  <span className="font-semibold text-[#C084FC]">{item.pct}%</span>
                </div>
              </div>

              {/* Glowing Dynamic Progress Slot */}
              <div className="h-2.5 w-full bg-[#0D0B14] rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out relative"
                  style={{ 
                    width: `${item.pct}%`, 
                    backgroundColor: item.color,
                    boxShadow: isHovered ? `0 0 12px ${item.color}` : "none"
                  }}
                >
                  {/* Glass Highlights */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#161122]/50 p-2.5 rounded-xl border border-white/5 text-[10px] text-gray-400 flex items-center justify-between">
        <span>Average Win Velocity: <strong className="text-gray-200">14.6 days</strong></span>
        <span>Dropoff Rate: <strong className="text-rose-400">55% Contacts</strong></span>
      </div>
    </div>
  );
}

export function LeadSourceWidget({ leads }: StatsVisualsProps) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  // Group leads value by sources
  const sourceGrouping = leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {} as Record<LeadSource, number>);

  const total = leads.length || 1;

  // Construct structured segment specs
  const segmentData = [
    { source: LeadSource.LINKEDIN, count: sourceGrouping[LeadSource.LINKEDIN] || 0, color: "#7C3AED", label: "LinkedIn" },
    { source: LeadSource.GOOGLE, count: sourceGrouping[LeadSource.GOOGLE] || 0, color: "#A855F7", label: "Google SEO" },
    { source: LeadSource.WEBSITE, count: sourceGrouping[LeadSource.WEBSITE] || 0, color: "#C084FC", label: "Website Form" },
    { source: LeadSource.REFERRAL, count: sourceGrouping[LeadSource.REFERRAL] || 0, color: "#34D399", label: "Referrals" },
    { source: LeadSource.COLD_OUTREACH, count: sourceGrouping[LeadSource.COLD_OUTREACH] || 0, color: "#F59E0B", label: "Outbound" },
  ];

  return (
    <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-[#C084FC]" />
          <h3 className="font-display font-semibold text-xs text-[#F8FAFC]">Acquisition Sourcing Yield</h3>
        </div>
        <span className="font-mono text-[9px] text-[#94A3B8]">Interactive Shares</span>
      </div>

      {/* Grid containing responsive SVG and descriptive cards */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Dynamic circular doughnut model */}
        <div className="sm:col-span-5 flex justify-center py-2 relative">
          <svg width="150" height="150" viewBox="0 0 150 150" className="transform -rotate-90">
            {/* Dynamic circle construction logic */}
            {(() => {
              let cumulativePercent = 0;
              const radius = 50;
              const circumference = 2 * Math.PI * radius;

              return segmentData.map((seg, i) => {
                if (seg.count === 0) return null;
                const pct = (seg.count / total) * 100;
                const strokeDashoffset = circumference - (pct / 100) * circumference;
                const strokeDasharray = `${circumference} ${circumference}`;
                const rotation = (cumulativePercent / 100) * 360;
                cumulativePercent += pct;

                const isMainHovered = activeSegment === seg.source;

                return (
                  <circle
                    key={seg.source}
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isMainHovered ? "14" : "9"}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(${rotation} 75 75)`}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setActiveSegment(seg.source)}
                    onMouseLeave={() => setActiveSegment(null)}
                    style={{
                      opacity: activeSegment && !isMainHovered ? 0.4 : 1,
                      filter: isMainHovered ? `drop-shadow(0 0 4px ${seg.color})` : "none"
                    }}
                  />
                );
              });
            })()}
            {/* Centered label */}
            <circle cx="75" cy="75" r="35" fill="#1F1830" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-gray-400">Total Leads</span>
            <span className="font-display font-bold text-base text-white">{leads.length}</span>
          </div>
        </div>

        {/* Legend listing */}
        <div className="sm:col-span-7 space-y-1.5">
          {segmentData.map((seg) => {
            if (seg.count === 0) return null;
            const percentage = Math.round((seg.count / total) * 100);
            const isHovered = activeSegment === seg.source;
            return (
              <div 
                key={seg.source}
                onMouseEnter={() => setActiveSegment(seg.source)}
                onMouseLeave={() => setActiveSegment(null)}
                className={`p-1.5 rounded-lg border transition-all duration-200 flex items-center justify-between text-[11px] ${
                  isHovered ? "bg-white/5 border-white/10" : "border-transparent bg-transparent"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className={`font-medium ${isHovered ? "text-white" : "text-gray-300"}`}>{seg.label}</span>
                </div>
                <div className="flex space-x-2 font-mono text-[10px]">
                  <span className="text-gray-400">({seg.count})</span>
                  <span className="font-semibold text-[#C084FC]">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function RevenueTrendWidget({ leads }: StatsVisualsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Hardcoded standard trending figures representing premium growth across last quarters
  const trendHistory = [
    { label: "Jan", revenue: 24000, leads: 18 },
    { label: "Feb", revenue: 31000, leads: 24 },
    { label: "Mar", revenue: 45000, leads: 38 },
    { label: "Apr", revenue: 61000, leads: 52 },
    { label: "May", revenue: 78000, leads: 68 },
    { label: "Jun", revenue: 84500, leads: leads.length * 10 }, // Dyn scale using mock state
  ];

  const maxVal = 95000;
  const paddingY = 20;
  const width = 340;
  const height = 120;

  // Compute responsive coord sets
  const points = trendHistory.map((pt, i) => {
    const x = (i / (trendHistory.length - 1)) * (width - 40) + 20;
    const y = height - ((pt.revenue / maxVal) * (height - paddingY) + paddingY / 2);
    return { x, y, ...pt };
  });

  // Build SVG bezier path string
  let pathStr = "";
  if (points.length > 0) {
    pathStr = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Tension parameters
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      pathStr += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }
  }

  // Build glowing area path
  const areaPathStr = points.length > 0 
    ? `${pathStr} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : "";

  return (
    <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-[#C084FC]" />
          <h3 className="font-display font-semibold text-xs text-[#F8FAFC]">Weighted Revenue Portfolio Trend</h3>
        </div>
        <div className="flex items-center space-x-1.5 font-mono text-[9px] text-[#C084FC] bg-[#7C3AED]/10 px-2 py-0.5 rounded-full">
          <Landmark className="w-3 h-3" />
          <span>Dynamic ARR Tracker</span>
        </div>
      </div>

      <div className="h-32 w-full pt-1 flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Defs definition for nice glowing gradients */}
          <defs>
            <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>

          {/* Guidelines */}
          <line x1="10" y1={height / 2} x2={width - 10} y2={height / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1="10" y1={height - 5} x2={width - 10} y2={height - 5} stroke="rgba(255,255,255,0.07)" />

          {/* Area under the line */}
          {areaPathStr && <path d={areaPathStr} fill="url(#areaGlow)" />}

          {/* Glowing Bezier Path Line */}
          {pathStr && (
            <path
              d={pathStr}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="drop-shadow(0 2px 4px rgba(124, 58, 237, 0.4))"
            />
          )}

          {/* Interactive coordinates points */}
          {points.map((pt, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <g 
                key={index}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? "#C084FC" : "#7C3AED"}
                  stroke="#1F1830"
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />
                
                {/* Text Labels for timeline */}
                <text
                  x={pt.x}
                  y={height - 2}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="7px"
                  fontFamily="monospace"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Dynamic Popover state projection */}
      <div className="h-10 px-3 bg-[#0D0B14]/75 border border-white/5 rounded-xl flex items-center justify-between text-xs">
        {hoveredIndex !== null ? (
          <>
            <span className="text-gray-400 font-mono text-[10px]">Month: {trendHistory[hoveredIndex].label}</span>
            <span className="font-semibold text-white">Metrics Portfolio: <strong className="text-[#C084FC]">${trendHistory[hoveredIndex].revenue.toLocaleString()}</strong></span>
            <span className="text-emerald-400 text-[10px] font-mono">+{Math.round((trendHistory[hoveredIndex].revenue / 24000) * 100 - 100)}%</span>
          </>
        ) : (
          <>
            <span className="text-gray-400 text-[10px]">Hover timeline nodes to query detailed historical intervals.</span>
            <span className="font-mono text-[10px] text-[#C084FC] font-semibold">ARR Growth Rate: 24.3% YoY</span>
          </>
        )}
      </div>
    </div>
  );
}
