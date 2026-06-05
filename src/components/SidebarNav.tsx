import React from "react";
import { UserRole, CurrentUser } from "../types";
import { 
  BarChart3, 
  Map, 
  Settings, 
  TrendingUp, 
  Users, 
  Grid, 
  Megaphone, 
  Layers, 
  Binary, 
  Activity, 
  LogOut, 
  Bell, 
  HelpCircle,
  BrainCircuit,
  CornerDownRight,
  X
} from "lucide-react";

interface SidebarNavProps {
  currentUser: CurrentUser;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  unreadCount: number;
  onClose?: () => void;
}

export default function SidebarNav({ currentUser, activeTab, setActiveTab, onLogout, unreadCount, onClose }: SidebarNavProps) {
  
  // Navigation tabs config mapping views to standard lucide icons
  const menuItems = [
    { id: "dashboard", label: "Analytics Overview", icon: Grid },
    { id: "leads", label: "Lead Profiles CRM", icon: Users },
    { id: "pipeline", label: "Pipeline Kanban", icon: Layers },
    { id: "campaigns", label: "Campaigns Hub", icon: Megaphone },
    { id: "analytics", label: "Decision Statistics", icon: Binary },
    { id: "settings", label: "System Config", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#161122] border-r border-[#1F1830] flex flex-col justify-between shrink-0 h-full text-gray-300 font-sans z-15">
      
      {/* Brand logo header with close button */}
      <div className="p-6 border-b border-[#1F1830]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3 group min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#C084FC] p-[1.5px] shadow-lg shadow-[#7C3AED]/15 shrink-0">
              <div className="w-full h-full bg-[#0D0B14] rounded-[10px] flex items-center justify-center">
                <span className="font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#C084FC] to-[#7C3AED] text-base">M</span>
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-semibold text-[#F8FAFC] tracking-tight text-sm leading-none truncate">MIP Platform</h2>
              <p className="text-[#94A3B8] font-mono text-[8.5px] uppercase tracking-wider leading-none mt-1 truncate">Ma Creatives Studio</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors md:hidden shrink-0"
              title="Close menu description"
              id="mobile-close-sidebar-btn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dynamic Authenticated role tagger */}
        <div className="mt-4 bg-[#0D0B14]/75 border border-white/5 px-3 py-2 rounded-xl flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#7C3AED] flex items-center justify-center animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C084FC]" />
          </div>
          <div>
            <span className="font-sans text-[10px] text-gray-400 block leading-tight">Current Level</span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#C084FC] font-semibold leading-none">
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation middle links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <span className="font-mono text-[8px] text-[#94A3B8] block px-3 uppercase tracking-wider font-semibold mb-2">
          Enterprise Modules
        </span>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 group ${
                isActive
                  ? "bg-gradient-to-r from-[#7C3AED]/20 to-[#A855F7]/10 text-white border border-[#7C3AED]/20 shadow-md shadow-[#7C3AED]/5"
                  : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? "text-[#C084FC]" : "text-gray-500 group-hover:text-gray-300"}`} />
                <span>{item.label}</span>
              </div>
              {item.id === "dashboard" && unreadCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] text-transparent" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User settings & footer action */}
      <div className="p-4 border-t border-[#1F1830] space-y-3 bg-[#0D0B14]/20">
        
        {/* Simplified Profile label */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#1F1830]/60 border border-white/5">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/35 shrink-0 text-xs font-semibold text-[#C084FC]">
              {currentUser.avatar || "SK"}
            </div>
            <div className="min-w-0">
              <span className="font-sans text-[11px] font-medium text-white block truncate leading-tight">
                {currentUser.name}
              </span>
              <span className="font-sans text-[9px] text-[#94A3B8] block truncate leading-none mt-0.5">
                {currentUser.role}
              </span>
            </div>
          </div>

          <button 
            onClick={onLogout}
            title="Log out session"
            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stephen Kimaru portfolio footer branding line */}
        <div className="text-[10px] text-center text-[#94A3B8]/30 space-y-1">
          <p>Built by <a href="https://stephenkimaru.github.io" target="_blank" rel="noopener noreferrer" className="hover:underline text-gray-500 hover:text-[#C084FC]">Stephen Kimaru</a></p>
          <p className="font-mono text-[8px] tracking-widest text-[#94A3B8]/20 uppercase">Ma Creatives Studio</p>
        </div>
      </div>

    </aside>
  );
}
