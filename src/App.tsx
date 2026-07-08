import React, { useState, useEffect } from "react";
import { 
  FunnelStage, 
  LeadSource, 
  Lead, 
  Campaign, 
  Activity, 
  FollowUp, 
  Notification, 
  UserRole, 
  CurrentUser 
} from "./types";
import { loadState, saveState, defaultLeads, defaultCampaigns, defaultFollowUps, defaultActivities, defaultNotifications } from "./dataStore";
import { apiClient, AppState } from "./api/client";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SidebarNav from "./components/SidebarNav";
import { SalesFunnelWidget, LeadSourceWidget, RevenueTrendWidget } from "./components/StatsVisuals";
import AnalyticsEngine from "./components/AnalyticsEngine";
import CampaignCenter from "./components/CampaignCenter";

import { 
  BarChart3, 
  Plus, 
  Sparkles, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  Layers, 
  Bot, 
  Bell, 
  Clock, 
  HelpCircle,
  Briefcase,
  TrendingUp,
  Flame,
  CheckCircle,
  TrendingDown,
  Mail,
  Phone,
  Building,
  User,
  Calendar,
  DollarSign,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  Send,
  Activity as ActivityIcon,
  Menu
} from "lucide-react";

export default function App() {
  // --- SESSION STATES ---
  const [isLanding, setIsLanding] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // --- APPLICATION DATA STATES (Seeded from loadState) ---
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // --- NAVIGATION TAB STATE ---
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // --- INTERACTIVE SELECTORS ---
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState<boolean>(false);
  const [leadFilterStage, setLeadFilterStage] = useState<string>("All");
  const [leadSearchQuery, setLeadSearchQuery] = useState<string>("");

  // --- NOTIFICATION TRAY STATE ---
  const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);

  // --- MOBILE SIDEBAR TRAY STATE ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // --- GEMINI CHAT ASSISTANT STATE ---
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isAiMocked, setIsAiMocked] = useState<boolean>(false);
  
  // --- BACKEND API SYSTEM STATES ---
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // --- MULTI-CURRENCY STANDARD STATE ---
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    return localStorage.getItem("mip_currency") || "KES";
  });

  const currencyRates: Record<string, { rate: number; symbol: string }> = {
    USD: { rate: 1.0, symbol: "$" },
    KES: { rate: 130.0, symbol: "KSh" },
    EUR: { rate: 0.92, symbol: "€" },
    GBP: { rate: 0.79, symbol: "£" },
    JPY: { rate: 155.0, symbol: "¥" },
    CAD: { rate: 1.36, symbol: "CA$" },
    INR: { rate: 83.5, symbol: "₹" },
    AUD: { rate: 1.50, symbol: "A$" }
  };

  const formatCurrency = (val: number): string => {
    const config = currencyRates[selectedCurrency] || currencyRates.KES;
    const converted = val * config.rate;
    return `${config.symbol} ${Math.round(converted).toLocaleString()}`;
  };

  // Load state on startup from backend API
  useEffect(() => {
    async function loadData() {
      setIsAuthLoading(true);
      try {
        // 1. Fetch current authentication status with robust automatic retry on server restart/cold-start
        let authRes: { user: CurrentUser | null } | null = null;
        let retries = 10;
        let delay = 400;
        while (retries > 0) {
          try {
            authRes = await apiClient.get<{ user: CurrentUser | null }>("/api/auth/me");
            break;
          } catch (err) {
            retries--;
            if (retries === 0) {
              console.warn("Failed to reach Auth API after 10 retries, trying final request...");
              authRes = await apiClient.get<{ user: CurrentUser | null }>("/api/auth/me");
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.5, 2000); // progressive backoff up to 2 seconds
          }
        }

        if (authRes && authRes.user) {
          setCurrentUser(authRes.user);
          setIsLanding(false);
        } else {
          setCurrentUser(null);
          setIsLanding(true);
        }

        // 2. Fetch entire state with robust automatic retry
        let state: AppState | null = null;
        retries = 10;
        delay = 400;
        while (retries > 0) {
          try {
            state = await apiClient.get<AppState>("/api/state");
            break;
          } catch (err) {
            retries--;
            if (retries === 0) {
              console.warn("Failed to reach State API after 10 retries, trying final request...");
              state = await apiClient.get<AppState>("/api/state");
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.5, 2000);
          }
        }

        if (state) {
          setLeads(state.leads);
          setCampaigns(state.campaigns);
          setFollowups(state.followups);
          setActivities(state.activities);
          setNotifications(state.notifications);
          setApiError(null);
        }
      } catch (err: any) {
        console.error("API failed on startup, using offline storage fallback:", err);
        setApiError("Backend disconnected. Running in offline sandbox mode.");
        
        // Fallback
        const state = loadState();
        setLeads(state.leads);
        setCampaigns(state.campaigns);
        setFollowups(state.followups);
        setActivities(state.activities);
        setNotifications(state.notifications);
        setCurrentUser(null);
        setIsLanding(true);
      } finally {
        setIsAuthLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync state back to local storage only as offline redundancy
  useEffect(() => {
    if (currentUser) {
      saveState({
        leads,
        campaigns,
        followups,
        activities,
        notifications,
        user: currentUser
      });
    }
  }, [leads, campaigns, followups, activities, notifications, currentUser]);

  // --- AUTH HANDLERS ---
  const handleLogin = async (user: CurrentUser) => {
    setIsAuthLoading(true);
    try {
      const loginRes = await apiClient.post<{ user: CurrentUser }>("/api/auth/login", user);
      setCurrentUser(loginRes.user);
      setIsLanding(false);

      // Refresh state
      const state = await apiClient.get<AppState>("/api/state");
      setLeads(state.leads);
      setCampaigns(state.campaigns);
      setFollowups(state.followups);
      setActivities(state.activities);
      setNotifications(state.notifications);
      setApiError(null);
    } catch (err: any) {
      console.error("Login API failed, falling back to sandbox mode:", err);
      setCurrentUser(user);
      setIsLanding(false);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthLoading(true);
    try {
      await apiClient.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      setCurrentUser(null);
      setIsLanding(true);
      setIsAuthLoading(false);
      localStorage.removeItem("mip_user_v1");
    }
  };

  // --- CRM LEAD MUTATORS ---
  const handleAddLead = async (newLead: Omit<Lead, "id" | "dateCreated" | "lastUpdated">) => {
    try {
      const updatedState = await apiClient.post<AppState>("/api/leads", newLead);
      setLeads(updatedState.leads);
      setCampaigns(updatedState.campaigns);
      setFollowups(updatedState.followups);
      setActivities(updatedState.activities);
      setNotifications(updatedState.notifications);
      setApiError(null);
    } catch (err) {
      console.error("Failed to add lead on backend:", err);
      setApiError("Failed to add lead on server. Using fallback.");
      
      // Fallback
      const fullLead: Lead = {
        ...newLead,
        id: `lead-${Date.now()}`,
        dateCreated: new Date().toISOString().split("T")[0],
        lastUpdated: new Date().toISOString().split("T")[0]
      };
      setLeads([fullLead, ...leads]);

      const auditLog: Activity = {
        id: `act-${Date.now()}`,
        type: "System Update",
        leadId: fullLead.id,
        leadName: fullLead.name,
        description: `New lead created at stage "${fullLead.stage}" with dynamic contract score of ${fullLead.leadScore}.`,
        performer: currentUser?.name || "System Automation",
        timestamp: new Date().toISOString()
      };
      setActivities([auditLog, ...activities]);

      const newNotify: Notification = {
        id: `n-${Date.now()}`,
        title: "Inbound Sourcing Alert",
        message: `${fullLead.company} (${fullLead.name}) generated dynamic CRM scores of ${fullLead.leadScore}/100.`,
        type: "success",
        isRead: false,
        time: new Date().toISOString()
      };
      setNotifications([newNotify, ...notifications]);
    }
  };

  const handleUpdateLeadStage = async (leadId: string, targetStage: FunnelStage) => {
    const previous = leads.find(l => l.id === leadId);
    if (!previous) return;

    try {
      const updatedState = await apiClient.patch<AppState>(`/api/leads/${leadId}/stage`, { stage: targetStage });
      setLeads(updatedState.leads);
      setCampaigns(updatedState.campaigns);
      setFollowups(updatedState.followups);
      setActivities(updatedState.activities);
      setNotifications(updatedState.notifications);
      setApiError(null);

      // Refresh focus details in side nav dynamically
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, stage: targetStage });
      }
    } catch (err) {
      console.error("Failed to update stage on backend:", err);
      setApiError("Stage update failed on server. Using fallback.");

      // Fallback
      const oldStage = previous.stage;
      const stageTransitionNotes = `Transitioned funnel stage path from [${oldStage}] to [${targetStage}].`;

      setLeads(leads.map(l => {
        if (l.id === leadId) {
          return {
            ...l,
            stage: targetStage,
            lastUpdated: new Date().toISOString().split("T")[0]
          };
        }
        return l;
      }));

      const auditLog: Activity = {
        id: `act-${Date.now()}`,
        type: "System Update",
        leadId: leadId,
        leadName: previous.name,
        description: stageTransitionNotes,
        performer: currentUser?.name || "System Automation",
        timestamp: new Date().toISOString()
      };
      setActivities([auditLog, ...activities]);

      if (targetStage === FunnelStage.WON) {
        setCampaigns(campaigns.map(camp => {
          if (camp.name.toLowerCase().includes("linkedin") && previous.source === LeadSource.LINKEDIN) {
            return { ...camp, conversions: camp.conversions + 1 };
          }
          if (camp.name.toLowerCase().includes("seo") && previous.source === LeadSource.GOOGLE) {
            return { ...camp, conversions: camp.conversions + 1 };
          }
          return camp;
        }));

        const milestoneNotify: Notification = {
          id: `n-${Date.now()}`,
          title: "Closed Won Deal Smashed",
          message: `${previous.company} finalized contract of $${previous.value.toLocaleString()}!`,
          type: "success",
          isRead: false,
          time: new Date().toISOString()
        };
        setNotifications([milestoneNotify, ...notifications]);
      }

      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, stage: targetStage });
      }
    }
  };

  const handleLogLeadActivity = async (leadId: string, description: string, type: any) => {
    const parentLead = leads.find(l => l.id === leadId);
    if (!parentLead) return;

    try {
      const updatedState = await apiClient.post<AppState>(`/api/leads/${leadId}/activities`, { type, description });
      setLeads(updatedState.leads);
      setCampaigns(updatedState.campaigns);
      setFollowups(updatedState.followups);
      setActivities(updatedState.activities);
      setNotifications(updatedState.notifications);
      setApiError(null);
    } catch (err) {
      console.error("Failed to log activity on backend:", err);
      setApiError("Failed to save activity on server.");

      // Fallback
      const newAct: Activity = {
        id: `act-${Date.now()}`,
        type: type,
        leadId: leadId,
        leadName: parentLead.name,
        description: description,
        performer: currentUser?.name || "Client Operator",
        timestamp: new Date().toISOString()
      };
      setActivities([newAct, ...activities]);
    }
  };

  const handleCreateLeadFollowup = async (leadId: string, notes: string, scheduledTime: string, type: any, priority: any) => {
    const parentLead = leads.find(l => l.id === leadId);
    if (!parentLead) return;

    try {
      const updatedState = await apiClient.post<AppState>(`/api/leads/${leadId}/followups`, {
        type,
        scheduledTime,
        notes,
        priority
      });
      setLeads(updatedState.leads);
      setCampaigns(updatedState.campaigns);
      setFollowups(updatedState.followups);
      setActivities(updatedState.activities);
      setNotifications(updatedState.notifications);
      setApiError(null);
    } catch (err) {
      console.error("Failed to create followup on backend:", err);
      setApiError("Failed to save followup on server.");

      // Fallback
      const newFollow: FollowUp = {
        id: `f-${Date.now()}`,
        leadId: leadId,
        leadName: parentLead.name,
        notes: notes,
        scheduledTime: scheduledTime,
        type: type,
        priority: priority,
        status: "Pending"
      };
      setFollowups([newFollow, ...followups]);

      const schedulerNotify: Notification = {
        id: `n-${Date.now()}`,
        title: "Follow-up Scheduled",
        message: `Follow-up ${type} with ${parentLead.name} scheduled for ${scheduledTime}.`,
        type: "info",
        isRead: false,
        time: new Date().toISOString()
      };
      setNotifications([schedulerNotify, ...notifications]);
    }
  };

  // --- APP LEVEL CAMPAIGN MUTATORS ---
  const handleAddNewCampaign = async (newCamp: Omit<Campaign, "id" | "leadsCount" | "conversions" | "clicks" | "impressions">) => {
    try {
      const updatedState = await apiClient.post<AppState>("/api/campaigns", newCamp);
      setLeads(updatedState.leads);
      setCampaigns(updatedState.campaigns);
      setFollowups(updatedState.followups);
      setActivities(updatedState.activities);
      setNotifications(updatedState.notifications);
      setApiError(null);
    } catch (err) {
      console.error("Failed to add campaign on backend:", err);
      setApiError("Failed to create campaign on server.");

      // Fallback
      const fullCamp: Campaign = {
        ...newCamp,
        id: `camp-${Date.now()}`,
        leadsCount: 0,
        conversions: 0,
        clicks: 450,
        impressions: 4000
      };
      setCampaigns([...campaigns, fullCamp]);
    }
  };

  // --- LOCAL NOTIFICATION HELPER ---
  const handleMarkNotificationsAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // --- GEMINI COINS ASSISTANT RUNNER ---
  const runAiGroundedQueries = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || aiPrompt;
    if (!finalPrompt.trim()) return;

    setIsAiLoading(true);
    setAiResponse("");

    // Prepare full unified snapshot metrics to assist grounding
    const dashboardState = {
      totalLeads: leads.length,
      activeLeads: leads.filter(l => ![FunnelStage.WON, FunnelStage.LOST].includes(l.stage)).length,
      conversionRate: `${Math.round((leads.filter(l => l.stage === FunnelStage.WON).length / (leads.filter(l => [FunnelStage.WON, FunnelStage.LOST].includes(l.stage)).length || 1)) * 100)}%`,
      wonDeals: leads.filter(l => l.stage === FunnelStage.WON).length,
      revenueGenerated: `$${leads.filter(l => l.stage === FunnelStage.WON).reduce((sum, l) => sum + l.value, 0).toLocaleString()}`,
      summaryContext: {
        activeLeadsDetails: leads.map(l => ({ name: l.name, company: l.company, score: l.leadScore, value: l.value, stage: l.stage })),
        campaignBudgetSplits: campaigns.map(c => ({ name: c.name, spent: c.spent, budget: c.budget, score: c.status }))
      }
    };

    try {
      const resData = await apiClient.post<{ text: string; isMock: boolean }>("/api/ai/query", {
        prompt: finalPrompt,
        dashboardState
      });
      setAiResponse(resData.text);
      setIsAiMocked(resData.isMock);
    } catch (error: any) {
      console.error(error);
      setAiResponse(`### ⚠️ System API Connection Timeout

MIP failed to connect to the Express background proxy. Ensure the server is actively running. 

**Diagnostic advice:**
1. Check process logs inside the root \`server.ts\`.
2. Confirm Gemini API credentials are set or fallback outputs are configured.`);
      setIsAiMocked(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0D0B14] text-white p-4 space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
        <div className="space-y-1 text-center">
          <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest animate-pulse">Establishing Secure Uplink...</p>
          <span className="text-[11px] text-[#A78BFA]/50 block font-mono">Ma Creatives Studio Platform</span>
        </div>
      </div>
    );
  }

  if (isLanding) {
    return <LandingPage onEnterApp={() => setIsLanding(false)} />;
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLogin} onBackToLanding={() => setIsLanding(true)} />;
  }

  // --- DYNAMIC CALCULATED DASHBOARD KPIs ---
  const totalLeadsCount = leads.length;
  const activeLeadsCount = leads.filter(l => ![FunnelStage.WON, FunnelStage.LOST].includes(l.stage)).length;
  const wonCount = leads.filter(l => l.stage === FunnelStage.WON).length;
  const lostCount = leads.filter(l => l.stage === FunnelStage.LOST).length;
  const grossARRResult = leads.filter(l => l.stage === FunnelStage.WON).reduce((sum, l) => sum + l.value, 0);
  const aggregateWinRatio = Math.round((wonCount / (wonCount + lostCount || 1)) * 100);

  // Filter leads based on user select stage and search bars
  const filteredGridLeads = leads.filter(lead => {
    const stageMatch = leadFilterStage === "All" || lead.stage === leadFilterStage;
    const searchMatch = 
      lead.name.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(leadSearchQuery.toLowerCase());
    return stageMatch && searchMatch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex h-screen bg-[#0D0B14] text-[#F8FAFC] font-sans overflow-hidden relative">
      
      {/* 1. Backdrop for Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 2. Side Navigation panel - collapsible on mobile, static on desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-300 ease-in-out md:static md:translate-x-0 h-full shrink-0 flex
      `}>
        <SidebarNav 
          currentUser={currentUser} 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }} 
          onLogout={handleLogout}
          unreadCount={unreadCount}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main Workspace Frame Container (Right Side) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top bar header navigation indicators */}
        <header className="h-16 border-b border-[#1F1830] bg-[#161122]/40 backdrop-blur px-4 md:px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
            {/* Hamburger Button for Mobile screens */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 md:hidden hover:bg-white/5 rounded-lg border border-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
              id="mobile-open-sidebar-btn"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="font-display font-bold text-xs sm:text-sm tracking-tight text-white capitalize truncate">
              {activeTab === "dashboard" && "Analytics Intelligence Dashboard"}
              {activeTab === "leads" && "Lead Profiles Manager CRM"}
              {activeTab === "pipeline" && "Visual Funnel Pipeline"}
              {activeTab === "campaigns" && "Sourcing Campaign Coordinator & ROI Engine"}
              {activeTab === "analytics" && "Decision Statistics Workspace"}
              {activeTab === "settings" && "Enterprise Space Config"}
            </h2>
            <span className="h-4 w-[1px] bg-white/10 shrink-0" />
            <span className="font-mono text-[9px] text-[#94A3B8] shrink-0 truncate hidden xs:inline">MIP SECURED REGION</span>
          </div>

          <div className="flex items-center space-x-4">
            
            {/* Quick role display */}
            <span className="text-[10px] bg-[#1F1830] border border-white/5 py-1 px-2 sm:px-3 rounded-full text-gray-300 font-mono shrink-0">
              <span className="hidden sm:inline">Role Permission: </span>
              <strong className="text-[#C084FC]">{currentUser.role}</strong>
            </span>

            {/* Dynamic Multi-Currency Selector */}
            <div className="flex items-center space-x-1.5 bg-[#1F1830] border border-white/5 py-1 px-2.5 rounded-xl text-xs text-gray-300 font-mono shrink-0">
              <span className="text-[10px] text-gray-500 hidden sm:inline uppercase">Currency:</span>
              <select
                value={selectedCurrency}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCurrency(val);
                  localStorage.setItem("mip_currency", val);
                  
                  // Trigger notification
                  const currencyNotify: Notification = {
                    id: `n-${Date.now()}`,
                    title: "Currency Display Updated",
                    message: `Platform currency formatting changed to ${val}.`,
                    type: "info",
                    isRead: false,
                    time: new Date().toISOString()
                  };
                  setNotifications([currencyNotify, ...notifications]);
                }}
                className="bg-transparent border-none text-[#C084FC] focus:outline-none focus:ring-0 font-bold cursor-pointer font-mono"
              >
                <option value="KES" className="bg-[#161122]">KES (KSh)</option>
                <option value="USD" className="bg-[#161122]">USD ($)</option>
                <option value="EUR" className="bg-[#161122]">EUR (€)</option>
                <option value="GBP" className="bg-[#161122]">GBP (£)</option>
                <option value="JPY" className="bg-[#161122]">JPY (¥)</option>
                <option value="CAD" className="bg-[#161122]">CAD (CA$)</option>
                <option value="INR" className="bg-[#161122]">INR (₹)</option>
                <option value="AUD" className="bg-[#161122]">AUD (A$)</option>
              </select>
            </div>

            {/* Notification Bell alert */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="p-2 hover:bg-white/5 rounded-xl border border-white/5 relative text-gray-400 hover:text-white transition-colors"
                title={`${unreadCount} Unread Logs`}
                id="notification-bell-btn"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#7C3AED] glow-purple animate-pulse" />
                )}
              </button>

              {/* Notification dropdown menu drawer */}
              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2.5 w-80 bg-[#161122] border border-[#1F1830] rounded-2xl p-4 shadow-2xl z-50 text-gray-300 space-y-3">
                  <div className="flex justify-between items-center border-b border-[#1F1830] pb-2">
                    <span className="font-display font-semibold text-xs text-white">System Signal Alerts</span>
                    <button 
                      onClick={handleMarkNotificationsAllRead}
                      className="text-[9.5px] text-[#C084FC] hover:underline"
                    >
                      Clear alerts
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-[10.5px] text-gray-500 text-center py-4">No active notification signals logged.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`p-2.5 rounded-xl border text-[11px] leading-tight flex justify-between gap-1.5 ${
                          notif.isRead ? "bg-transparent border-transparent text-gray-400" : "bg-[#1F1830]/80 border-[#7C3AED]/15 text-gray-200"
                        }`}>
                          <div>
                            <span className="font-medium text-white block text-[11px] mb-0.5">{notif.title}</span>
                            <span>{notif.message}</span>
                            <span className="block text-[8.5px] font-mono text-[#94A3B8] mt-1">
                              {new Date(notif.time).toLocaleTimeString()}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="text-gray-600 hover:text-rose-400 text-[10px]"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Outer view frame viewport wrapper */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {/* 1. VIEW PORT: CORES DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Dynamic Sourced KPI Panels Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                
                <div className="bg-[#1F1830] border border-white/5 p-4 rounded-2xl space-y-1.5 relative overflow-hidden group">
                  <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">Gross Sourced Leads</span>
                  <p className="text-2xl font-bold font-display text-white">{totalLeadsCount}</p>
                  <span className="text-[9px] text-[#C084FC] block font-mono">Captured DB accounts</span>
                </div>

                <div className="bg-[#1F1830] border border-white/5 p-4 rounded-2xl space-y-1.5 relative overflow-hidden group">
                  <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">Active Pipeline</span>
                  <p className="text-2xl font-bold font-display text-white">{activeLeadsCount}</p>
                  <span className="text-[9px] text-emerald-400 block font-mono">Negotiation rate high</span>
                </div>

                <div className="bg-[#1F1830] border border-white/5 p-4 rounded-2xl space-y-1.5 relative overflow-hidden group">
                  <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">Closed Won Sells</span>
                  <p className="text-2xl font-bold font-display text-emerald-400">{wonCount}</p>
                  <span className="text-[9px] text-gray-400 block font-mono">Avg score: 91/100</span>
                </div>

                <div className="bg-[#1F1830] border border-white/5 p-4 rounded-2xl space-y-1.5 relative overflow-hidden group">
                  <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">Yield Portfolio ARR</span>
                  <p className="text-2xl font-bold font-display text-[#C084FC]">{formatCurrency(grossARRResult)}</p>
                  <span className="text-[9px] text-emerald-400 block font-mono">Contracts validated</span>
                </div>

                <div className="bg-[#1F1830] border border-white/5 p-4 rounded-2xl space-y-1.5 col-span-2 md:col-span-1 border-l-[#7C3AED] relative overflow-hidden group">
                  <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">Consolidated Win Ratio</span>
                  <p className="text-2xl font-bold font-display text-[#C084FC]">{aggregateWinRatio}%</p>
                  <span className="text-[9px] text-gray-400 block font-mono">Conversion index</span>
                </div>

              </div>

              {/* Graphical trends breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SalesFunnelWidget leads={leads} />
                <LeadSourceWidget leads={leads} />
                <RevenueTrendWidget leads={leads} formatCurrency={formatCurrency} />
              </div>

              {/* Lower panels: Recent tasks followups & dynamic CRM activity feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Pending Followups */}
                <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[#C084FC]" />
                      <h3 className="font-display font-semibold text-xs text-white">Pending High-Priority Client Tasks</h3>
                    </div>
                    <span className="font-mono text-[9px] bg-[#7C3AED]/10 text-[#C084FC] px-2 py-0.5 rounded-full">CRM Calendar</span>
                  </div>

                  <div className="space-y-3">
                    {followups.filter(f => f.status === "Pending").slice(0, 4).map((f) => (
                      <div key={f.id} className="p-3 bg-[#161122]/60 rounded-xl border border-white/5 flex justify-between items-center text-[11px] hover:border-white/10 transition-colors">
                        <div className="space-y-1">
                          <strong className="text-white block font-display">{f.leadName} ({f.type})</strong>
                          <span className="text-gray-400 block leading-tight">{f.notes}</span>
                          <span className="text-[9px] font-mono text-gray-500 block">Scheduled Target: {f.scheduledTime.replace("T", " ")}</span>
                        </div>
                        <span className={`text-[8.5px] px-2 py-0.5 rounded-full uppercase font-mono ${
                          f.priority === "High" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {f.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit trail Activities log */}
                <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="flex items-center space-x-2">
                      <ActivityIcon className="w-4 h-4 text-[#C084FC]" />
                      <h3 className="font-display font-semibold text-xs text-white">CRM Audit Trail Activities logs</h3>
                    </div>
                    <span className="font-mono text-[9px] text-[#94A3B8]">Continuous feed</span>
                  </div>

                  <div className="space-y-3">
                    {activities.slice(0, 4).map((act) => (
                      <div key={act.id} className="p-3 bg-[#161122]/60 rounded-xl border border-white/5 text-[11px] flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="font-mono text-[9.5px] text-[#94A3B8]">Logged by: {act.performer} • Action on {act.leadName}</span>
                          <p className="text-gray-200 leading-tight">{act.description}</p>
                          <span className="text-[8.5px] text-gray-500 font-mono block">{new Date(act.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <span className="text-[9px] font-mono bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">
                          {act.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 2. VIEW PORT: LEAD PROFILES CRM GRID */}
          {activeTab === "leads" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Filter tools toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1F1830] p-4 rounded-xl border border-white/5">
                
                {/* Search bar inputs */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name, company, email..."
                    value={leadSearchQuery}
                    onChange={(e) => setLeadSearchQuery(e.target.value)}
                    className="w-full bg-[#0D0B14] border border-white/5 text-xs rounded-xl pl-9 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED]/80"
                  />
                </div>

                {/* Filter tab toggles */}
                <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <div className="flex bg-[#0D0B14] p-1 rounded-xl border border-white/5 gap-1 text-[11.5px]">
                    {["All", ...Object.values(FunnelStage)].map((stg) => (
                      <button
                        key={stg}
                        onClick={() => setLeadFilterStage(stg)}
                        className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors duration-200 ${
                          leadFilterStage === stg 
                            ? "bg-[#7C3AED] text-white" 
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {stg.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Add Lead Action */}
                <button
                  onClick={() => setShowAddLeadModal(true)}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Lead Profile
                </button>

              </div>

              {/* Lead creator dialog overlay */}
              {showAddLeadModal && (
                <div className="fixed inset-0 bg-[#0D0B14]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-[#161122] border border-[#7C3AED]/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
                    <div className="border-b border-[#1F1830] pb-3">
                      <h3 className="font-display font-semibold text-sm text-white">Create Lead Profile Entry</h3>
                      <p className="text-[11px] text-gray-400">Initialize a new sales prospect record in the MIP database.</p>
                    </div>

                    {/* Standard creator fields */}
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const nameStr = fd.get("name") as string;
                      const companyStr = fd.get("company") as string;
                      const emailStr = fd.get("email") as string;
                      const phoneStr = fd.get("phone") as string;
                      const valNum = parseInt(fd.get("value") as string) || 5000;
                      const stageSel = fd.get("stage") as FunnelStage;
                      const sourceSel = fd.get("source") as LeadSource;
                      const scoreNum = Math.floor(Math.random() * 30) + 60; // Dynamic starter score
                      
                      handleAddLead({
                        name: nameStr,
                        company: companyStr,
                        email: emailStr,
                        phone: phoneStr,
                        value: valNum,
                        stage: stageSel,
                        source: sourceSel,
                        leadScore: scoreNum,
                        assignee: "Alex Cooper",
                        notes: fd.get("notes") as string || ""
                      });
                      setShowAddLeadModal(false);
                    }} className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">Contact Name</label>
                          <input type="text" name="name" required placeholder="John Doe" className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">Company Entity</label>
                          <input type="text" name="company" required placeholder="Acme Logistics Inc" className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">Primary Email Address</label>
                          <input type="email" name="email" required placeholder="john@acme.com" className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">Phone contact</label>
                          <input type="tel" name="phone" required placeholder="+1 (555) 000-0000" className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">Expected Deal Value ({selectedCurrency})</label>
                          <input type="number" name="value" defaultValue={15000} className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">funnel placement</label>
                          <select name="stage" className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white focus:outline-none">
                            {Object.values(FunnelStage).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] text-gray-400 uppercase">Acquisition Channel Sourcing</label>
                          <select name="source" className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white focus:outline-none">
                            {Object.values(LeadSource).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] text-gray-400 uppercase">Sourcing profile notes</label>
                          <textarea name="notes" placeholder="e.g. Seeking high scale visualizers..." className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white h-16 resize-none" />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3.5 pt-3">
                        <button type="button" onClick={() => setShowAddLeadModal(false)} className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-xs">
                          Cancel
                        </button>
                        <button type="submit" className="px-5 py-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white rounded-xl text-xs font-semibold">
                          Save Profile
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Split screen: left holds table search, right holds detailed selections */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* Leads grid table */}
                <div className="xl:col-span-8 bg-[#1F1830] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs text-gray-300">
                      <thead>
                        <tr className="border-b border-[#1F1830] bg-[#161122]/40 text-gray-400 font-mono text-[9.5px] uppercase">
                          <th className="p-4">Contact & Entity</th>
                          <th className="p-4">Funnel stage</th>
                          <th className="p-4 text-right">Pipeline value</th>
                          <th className="p-4 text-center">Score index</th>
                          <th className="p-4">Assignee</th>
                          <th className="p-4">Sourcing channel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F1830]">
                        {filteredGridLeads.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-500 font-mono">No matching leads discovered in current filters.</td>
                          </tr>
                        ) : (
                          filteredGridLeads.map((lead) => {
                            const isSelected = selectedLead && selectedLead.id === lead.id;
                            return (
                              <tr 
                                key={lead.id}
                                onClick={() => setSelectedLead(lead)}
                                className={`group cursor-pointer transition-colors ${
                                  isSelected ? "bg-[#7C3AED]/10 text-white" : "hover:bg-white/5"
                                }`}
                              >
                                <td className="p-4">
                                  <div className="font-semibold block text-white text-[12.5px] group-hover:text-[#C084FC] transition-colors">{lead.name}</div>
                                  <div className="text-gray-400 text-[10px] mt-0.5">{lead.company}</div>
                                </td>
                                <td className="p-4">
                                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase leading-none font-bold ${
                                    lead.stage === FunnelStage.WON ? "bg-emerald-500/10 text-emerald-400" :
                                    lead.stage === FunnelStage.LOST ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-gray-300"
                                  }`}>
                                    {lead.stage}
                                  </span>
                                </td>
                                <td className="p-4 text-right font-semibold font-mono text-[12px] text-white">
                                  {formatCurrency(lead.value)}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`font-mono font-bold text-[10.5px] ${
                                    lead.leadScore > 85 ? "text-emerald-400" : lead.leadScore > 50 ? "text-amber-400" : "text-gray-400"
                                  }`}>
                                    {lead.leadScore} / 100
                                  </span>
                                </td>
                                <td className="p-4 text-gray-400 font-medium">
                                  {lead.assignee}
                                </td>
                                <td className="p-4 text-gray-400 font-mono text-[10px]">
                                  {lead.source.split(" ")[0]}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Lead Profile Insight & Drawer Card */}
                <div className="xl:col-span-4 bg-[#1F1830] border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl relative min-h-[300px]">
                  {selectedLead ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      
                      {/* Contact top summary header */}
                      <div className="border-b border-[#1F1830] pb-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-display font-semibold text-base text-white">{selectedLead.name}</h3>
                            <p className="text-[11px] text-[#94A3B8]">{selectedLead.company}</p>
                          </div>
                          
                          {/* CRM dynamic matching evaluation score */}
                          <div className="bg-[#7C3AED]/10 text-center border border-[#7C3AED]/25 px-2.5 py-1 rounded-xl">
                            <span className="text-[8px] uppercase tracking-wide text-gray-400 block font-mono">Conversion Score</span>
                            <span className="font-mono text-xs font-bold text-[#C084FC]">{selectedLead.leadScore}%</span>
                          </div>
                        </div>

                        {/* CRM stages switcher dropdown */}
                        <div className="space-y-1">
                          <label className="font-mono text-[9px] text-[#94A3B8] uppercase block">Update Pipeline Funnel Stage</label>
                          <select
                            value={selectedLead.stage}
                            onChange={(e) => handleUpdateLeadStage(selectedLead.id, e.target.value as FunnelStage)}
                            className="bg-[#0D0B14] w-[90%] text-xs text-white border border-white/5 py-1.5 px-3 rounded-xl focus:outline-none focus:border-[#7C3AED]"
                          >
                            {Object.values(FunnelStage).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Contact Channels */}
                      <div className="space-y-2 text-xs text-gray-300">
                        <span className="font-mono text-[9px] text-[#94A3B8] uppercase block">Identity Channel</span>
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2 text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-gray-500" />
                            <span>{selectedLead.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-gray-500" />
                            <span>{selectedLead.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Specific Notes logs */}
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] text-[#94A3B8] uppercase block">Acquisition dossier notes</span>
                        <p className="text-[11.5px] text-gray-300 leading-normal bg-[#0D0B14]/40 p-2.5 rounded-xl border border-white/5 font-mono">
                          {selectedLead.notes || "No sourcing context logged."}
                        </p>
                      </div>

                      {/* Form: log action activities on lead */}
                      <div className="space-y-3 pt-3 border-t border-[#1F1830]">
                        <span className="font-mono text-[9px] text-gray-400 block uppercase font-bold">Write Activity / Schedule</span>
                        
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const val = (document.getElementById("action-note-input") as HTMLInputElement).value;
                          const selectType = (document.getElementById("action-type-input") as HTMLSelectElement).value;
                          if (!val.trim()) return;
                          handleLogLeadActivity(selectedLead.id, val, selectType);
                          (document.getElementById("action-note-input") as HTMLInputElement).value = "";
                        }} className="space-y-2">
                          <div className="flex gap-2">
                            <select id="action-type-input" className="bg-[#0D0B14] text-[10.5px] border border-white/5 py-1 px-1.5 rounded-lg text-white">
                              <option value="Phone Call">Phone Call</option>
                              <option value="Note">Note</option>
                              <option value="Email">Email</option>
                              <option value="Meeting">Meeting</option>
                            </select>
                            <input 
                              id="action-note-input" 
                              type="text" 
                              required 
                              placeholder="e.g. Spoke to Decision maker... " 
                              className="w-full bg-[#0D0B14]/80 text-[11px] py-1 px-2.5 focus:outline-none border border-white/5 rounded-xl text-white" 
                            />
                            <button type="submit" className="px-2.5 py-1 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[10.5px] font-bold rounded-lg shrink-0">Log</button>
                          </div>
                        </form>

                        {/* Schedule followup */}
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          const note = fd.get("f_note") as string;
                          const clock = fd.get("f_date") as string;
                          const style = fd.get("f_type") as any;
                          const priority = fd.get("f_prior") as any;
                          if (!note.trim() || !clock) return;
                          handleCreateLeadFollowup(selectedLead.id, note, clock, style, priority);
                          e.currentTarget.reset();
                        }} className="space-y-2.5 bg-[#0D0B14]/40 p-3 rounded-xl border border-white/5 text-xs">
                          <span className="text-[9px] text-gray-400 font-mono block uppercase">Schedule Task/Call Reminder</span>
                          
                          <input type="text" name="f_note" required placeholder="e.g. Schedule CRM platform demonstration" className="w-full bg-[#0D0B14] text-[10.5px] border border-white/5 p-1.5 rounded text-gray-200" />
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <input type="datetime-local" name="f_date" required className="bg-[#0D0B14] border border-white/5 p-1 rounded text-white text-[9.5px]" />
                            <select name="f_type" className="bg-[#0D0B14] border border-white/5 p-1 rounded text-white">
                              <option value="Call">Call Task</option>
                              <option value="Meeting">Meeting Session</option>
                              <option value="Email">Cold Followup</option>
                            </select>
                          </div>
                          
                          <div className="flex justify-between items-center pt-1.5">
                            <select name="f_prior" className="bg-[#0D0B14] text-[9px] border border-white/5 py-0.5 px-1.5 rounded text-gray-400">
                              <option value="High">High Pr.</option>
                              <option value="Medium">Medium Pr.</option>
                              <option value="Low">Low Pr.</option>
                            </select>
                            <button type="submit" className="px-3 py-1 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-semibold rounded text-[10px]">
                              Schedule Remind
                            </button>
                          </div>
                        </form>
                      </div>

                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-gray-500 font-mono space-y-3">
                      <Briefcase className="w-8 h-8 text-gray-600 animate-bounce" />
                      <div className="space-y-1">
                        <span className="text-white text-xs block font-semibold font-display">No Lead Selected</span>
                        <p className="text-[10px] leading-relaxed max-w-[200px]">Click any row item to inspect profiles, audit trail logs, or trigger follow-up reminders.</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* 3. VIEW PORT: PIPELINE KANBAN BOARD */}
          {activeTab === "pipeline" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="flex justify-between items-center bg-[#1F1830] p-4 rounded-xl border border-white/5">
                <p className="text-xs text-gray-400">
                  Observe and shift active sales deals across funnel milestones. Stage values sum is dynamic.
                </p>
                <div className="font-mono text-[9px] bg-[#7C3AED]/10 text-[#C084FC] border border-[#7C3AED]/25 px-2.5 py-1 rounded-full">
                  Stage Probability Engine Online
                </div>
              </div>

              {/* Kanban Horizontal board columns */}
              <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">
                {Object.values(FunnelStage).map((stage) => {
                  const stageLeads = leads.filter(l => l.stage === stage);
                  const stageSumValue = stageLeads.reduce((sum, l) => sum + l.value, 0);

                  return (
                    <div key={stage} className="bg-[#161122]/90 border border-white/5 rounded-2xl w-72 shrink-0 p-4 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <div>
                          <h4 className="font-display font-semibold text-xs text-white block">{stage}</h4>
                          <span className="text-[9.5px] font-mono text-gray-500 block mt-0.5">{stageLeads.length} pipeline items</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#C084FC] font-semibold">{formatCurrency(stageSumValue)}</span>
                      </div>

                      <div className="space-y-2 max-h-[380px] overflow-y-auto">
                        {stageLeads.length === 0 ? (
                          <div className="text-center py-8 text-[10.5px] text-gray-600 border border-dashed border-white/5 rounded-xl font-mono">No stage records</div>
                        ) : (
                          stageLeads.map((lead) => (
                            <div key={lead.id} className="bg-[#1F1830] border border-white/5 hover:border-[#7C3AED]/30 p-3 rounded-xl space-y-3 text-xs transition-all relative">
                              <div className="flex justify-between items-start">
                                <div>
                                  <strong className="text-white block font-display leading-tight">{lead.name}</strong>
                                  <span className="text-gray-400 text-[10px] block mt-0.5">{lead.company}</span>
                                </div>
                                <span className="font-mono font-semibold text-[#C084FC] block">{formatCurrency(lead.value)}</span>
                              </div>

                              <div className="flex justify-between items-center text-[10px] pt-1 border-t border-white/5">
                                <span className="font-mono text-gray-500">Score: {lead.leadScore}%</span>
                                
                                {/* Manual navigation levers */}
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => {
                                      const order = Object.values(FunnelStage);
                                      const idx = order.indexOf(stage);
                                      if (idx > 0) handleUpdateLeadStage(lead.id, order[idx - 1]);
                                    }}
                                    disabled={stage === FunnelStage.NEW_LEAD}
                                    title="Move back stage"
                                    className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white disabled:opacity-20 transition-all"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const order = Object.values(FunnelStage);
                                      const idx = order.indexOf(stage);
                                      if (idx < order.length - 1) handleUpdateLeadStage(lead.id, order[idx + 1]);
                                    }}
                                    disabled={stage === FunnelStage.LOST || stage === FunnelStage.WON}
                                    title="Move forward stage"
                                    className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white disabled:opacity-20 transition-all"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* 4. VIEW PORT: MARKETING CAMPAIGNS HUB */}
          {activeTab === "campaigns" && (
            <CampaignCenter 
              campaigns={campaigns} 
              onAddCampaign={handleAddNewCampaign} 
              userRole={currentUser.role} 
              formatCurrency={formatCurrency}
              selectedCurrency={selectedCurrency}
            />
          )}

          {/* 5. VIEW PORT: APPLIED STATISTICS */}
          {activeTab === "analytics" && (
            <AnalyticsEngine leads={leads} campaigns={campaigns} formatCurrency={formatCurrency} />
          )}

          {/* 6. VIEW PORT: SYSTEM CONFIG & SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
              
              {/* Preset Role authentication swap panel */}
              <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
                <div>
                  <h3 className="font-display font-semibold text-sm text-white">Permission Authorization presets</h3>
                  <p className="text-xs text-[#94A3B8]">Swap mock environment user personas instantly to verify gated interfaces.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(Object.values(UserRole) as UserRole[]).map((role) => {
                    const active = currentUser.role === role;
                    return (
                      <button
                        key={role}
                        onClick={() => {
                          const name = role === UserRole.ADMIN ? "Stephen Kimaru" : role === UserRole.MARKETING_MANAGER ? "Sarah Connor" : "Alex Cooper";
                          const email = role === UserRole.ADMIN ? "macreatives.global@gmail.com" : role === UserRole.MARKETING_MANAGER ? "sconnor@macreatives.com" : "acooper@macreatives.com";
                          setCurrentUser({
                            name,
                            email,
                            role,
                            avatar: name.split(" ").map(w => w[0]).join("")
                          });
                        }}
                        className={`p-3 rounded-xl border text-[11px] font-medium leading-none font-display flex flex-col items-center justify-center space-y-1.5 transition-all text-center ${
                          active 
                            ? "bg-[#7C3AED]/20 border-[#7C3AED] text-[#C084FC]"
                            : "bg-[#161122]/60 border-white/5 text-gray-400 hover:bg-[#1F1830]"
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{role}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Integrations field models: WhatsApp / Email */}
              <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
                <div>
                  <h3 className="font-display font-semibold text-sm text-white">System Integrations Configuration</h3>
                  <p className="text-xs text-[#94A3B8]">Configure connection tokens for external automation interfaces.</p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Meta WhatsApp Business API Endpoint</label>
                    <input type="text" defaultValue="https://graph.facebook.com/v16.0/10940392348/messages" className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-gray-300 font-mono text-[11px]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">SMTP Email Relaying credentials</label>
                    <input type="text" defaultValue="smtp.macreatives.relay-server.net:587" className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-gray-300 font-mono text-[11px]" />
                  </div>
                </div>
              </div>

              {/* Secrets prompt advice */}
              <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-6 space-y-3 shadow-xl">
                <span className="font-display font-semibold text-sm text-white block">Gemini API Key binding</span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Natural Language Analytics queries are routed securely through the full-stack server proxy. 
                  MIP checks your system variables for \`GEMINI_API_KEY\`. 
                  To bind your custom AI credentials, assign your secret key within the platform's **Settings & Secrets panel**.
                </p>
                <div className="bg-[#0D0B14]/80 text-[10px] font-mono p-3 rounded-xl border border-white/5 text-gray-500">
                  PORT BIND: 3000 (SECURED) • SECRETS: AUTOMATICALLY DELEGATED BY WORKSPACE LAYER.
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* --- INTEGRATED FLOATING CHAT CO-PILOT ASSISTANT DRAWER --- */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <div className="relative">
          {/* Floating toggle bubble */}
          <button 
            type="button"
            onClick={() => {
              const panel = document.getElementById("ai-pilot-drawer");
              if (panel) panel.classList.toggle("hidden");
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] glow-purple text-white flex items-center justify-center hover:scale-[1.05] shadow-2xl transition-all cursor-pointer border border-[#C084FC]/20"
            title="Open AI Conversational Query Copilot"
            id="ai-pilot-bubble"
          >
            <Bot className="w-5.5 h-5.5 text-white animate-pulse" />
          </button>

          {/* Assistant panel cards */}
          <div 
            id="ai-pilot-drawer" 
            className="hidden absolute bottom-14 right-0 w-[420px] max-w-[90vw] bg-[#161122]/95 backdrop-blur-md border border-[#7C3AED]/30 rounded-2xl shadow-2xl p-4 overflow-hidden z-50 text-gray-300 flex flex-col h-[520px]"
          >
            {/* Header */}
            <div className="pb-3 border-b border-white/5 flex justify-between items-center bg-[#1F1830]/40 -mx-4 -mt-4 p-4 mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-[#7C3AED]/15 rounded-lg border border-[#7C3AED]/35 text-[#C084FC]">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-xs text-white">MIP Co-Pilot AI Core</h4>
                  <span className="font-mono text-[8px] text-emerald-400 block tracking-wider uppercase font-bold">Gemini Server Integrated</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  const panel = document.getElementById("ai-pilot-drawer");
                  if (panel) panel.classList.add("hidden");
                }}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg"
              >
                Hide
              </button>
            </div>

            {/* Conversation outputs viewport */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin text-xs leading-relaxed">
              
              <div className="bg-[#1F1830]/70 p-3 rounded-xl border border-white/5">
                <p className="text-[#C084FC] font-semibold text-[11px] font-display flex items-center gap-1">
                  💡 Prompt Suggestions:
                </p>
                <div className="flex flex-col gap-1.5 mt-2">
                  <button 
                    onClick={() => {
                      setAiPrompt("Summarize active sales and potential bottlenecks.");
                      runAiGroundedQueries("Summarize active sales and potential bottlenecks.");
                    }}
                    className="p-2 bg-[#0D0B14] hover:bg-[#7C3AED]/20 border border-white/5 hover:border-[#7C3AED]/30 rounded-lg text-left text-[10.5px] transition-all text-gray-300"
                  >
                    🚀 "Summarize active sales and bottlenecks"
                  </button>
                  <button 
                    onClick={() => {
                      setAiPrompt("Generate optimal scheduling suggestions and tasks for high budget leads.");
                      runAiGroundedQueries("Generate optimal scheduling suggestions and tasks for high budget leads.");
                    }}
                    className="p-2 bg-[#0D0B14] hover:bg-[#7C3AED]/20 border border-white/5 hover:border-[#7C3AED]/30 rounded-lg text-left text-[10.5px] transition-all text-gray-300"
                  >
                    📅 "Suggest high-value deal task scheduling priorities"
                  </button>
                  <button 
                    onClick={() => {
                      setAiPrompt("Model marketing campaign budget reallocations based on Conversions and cost per lead.");
                      runAiGroundedQueries("Model marketing campaign budget reallocations based on Conversions and cost per lead.");
                    }}
                    className="p-2 bg-[#0D0B14] hover:bg-[#7C3AED]/20 border border-white/5 hover:border-[#7C3AED]/30 rounded-lg text-left text-[10.5px] transition-all text-gray-300"
                  >
                    📊 "Optimize active ad budget reallocations"
                  </button>
                </div>
              </div>

              {/* Bot Response wrapper bubble */}
              {(aiResponse || isAiLoading) && (
                <div className="bg-[#0D0B14]/90 p-4 border border-[#7C3AED]/20 rounded-xl relative space-y-2">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#C084FC]">AI Report Response</span>
                    {isAiMocked && (
                      <span className="text-[8px] text-amber-400 font-mono">Sandbox Sandbox Mode</span>
                    )}
                  </div>
                  
                  {isAiLoading ? (
                    <div className="flex items-center space-x-2 py-4 justify-center text-gray-500 text-xs">
                      <span className="w-1.5 h-1.5 bg-[#C084FC] rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-[#C084FC] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-[#C084FC] rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span>Processing Predictive Analytics...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line text-[11px] prose prose-invert font-sans text-gray-200">
                      {aiResponse}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Input form */}
            <div className="pt-3 border-t border-white/5 mt-auto">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  runAiGroundedQueries();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask Gemini analytics question..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex-1 bg-[#0D0B14] text-xs py-2.5 px-3 rounded-xl border border-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-[#7C3AED]"
                  disabled={isAiLoading}
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="px-3 py-2.5 bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-20 text-white rounded-xl text-xs font-semibold flex items-center justify-center shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
