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
  CurrentUser,
  PipelineStage,
  WorkspaceMembership,
} from "./types";
import { apiClient, AppState } from "./api/client";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import WorkspaceSetup, { WorkspaceSetupInput } from "./components/WorkspaceSetup";
import SidebarNav from "./components/SidebarNav";
import { SalesFunnelWidget, LeadSourceWidget } from "./components/StatsVisuals";
import AnalyticsEngine from "./components/AnalyticsEngine";
import CampaignCenter from "./components/CampaignCenter";
import SocialContentHub from "./components/SocialContentHub";

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
  Calendar,
  DollarSign,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  Send,
  Activity as ActivityIcon,
  Menu,
  Edit,
  Trash2,
  RotateCcw,
  Trash
} from "lucide-react";

interface AuthSessionResponse {
  user: CurrentUser | null;
  workspaces: WorkspaceMembership[];
  activeWorkspaceId: string | null;
  token?: string;
}

interface CreateWorkspaceResponse {
  workspace: { currency: string | null };
  membership: WorkspaceMembership;
}

export default function App() {
  // --- SESSION STATES ---
  const [isLanding, setIsLanding] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // --- APPLICATION DATA STATES (Seeded from loadState / PostgreSQL) ---
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
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
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditLeadModal, setShowEditLeadModal] = useState<boolean>(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.SALES_AGENT);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

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
    if (val === undefined || val === null || isNaN(val)) return "$0";
    const config = currencyRates[selectedCurrency] || currencyRates.KES;
    const converted = val * config.rate;
    return `${config.symbol} ${Math.round(converted).toLocaleString()}`;
  };

  const applyAppState = (state: AppState) => {
    setPipelineStages(state.pipelineStages ?? []);
    setLeads(state.leads);
    setCampaigns(state.campaigns);
    setFollowups(state.followups);
    setActivities(state.activities);
    setNotifications(state.notifications);
  };

  const clearAppState = () => {
    setPipelineStages([]);
    setLeads([]);
    setCampaigns([]);
    setFollowups([]);
    setActivities([]);
    setNotifications([]);
  };

  // Load state on startup from backend API
  useEffect(() => {
    async function loadData() {
      setIsAuthLoading(true);
      try {
        // Fast concurrent fetcher for instant load time
        const fetchWithRetry = async <T,>(url: string, retries = 2, delay = 100): Promise<T> => {
          try {
            return await apiClient.get<T>(url);
          } catch (err) {
            if (retries <= 1) throw err;
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchWithRetry<T>(url, retries - 1, delay * 1.5);
          }
        };

        // State is protected, so it is only requested after a valid session is restored.
        const authRes = await fetchWithRetry<AuthSessionResponse>("/api/auth/me").catch(() => ({
          user: null,
          workspaces: [],
          activeWorkspaceId: null,
        }));

        if (!authRes?.user) {
          setCurrentUser(null);
          setWorkspaces([]);
          setActiveWorkspaceId(null);
          clearAppState();
          setIsLanding(true);
          setApiError(null);
          return;
        }
        const activeWorkspace = authRes.workspaces.find((workspace) => workspace.organizationId === authRes.activeWorkspaceId);
        setCurrentUser({ ...authRes.user, role: activeWorkspace?.role ?? UserRole.ADMIN });
        setWorkspaces(authRes.workspaces);
        setActiveWorkspaceId(authRes.activeWorkspaceId);
        setIsLanding(false);

        if (!authRes.activeWorkspaceId) {
          clearAppState();
          setApiError(null);
          return;
        }

        const state = await fetchWithRetry<AppState>("/api/state");
        applyAppState(state);
        setApiError(null);
      } catch (err: any) {
        console.error("API sync error on startup:", err);
        setApiError("Database connection issue. Unable to sync data with PostgreSQL server.");
      } finally {
        setIsAuthLoading(false);
      }
    }
    loadData();
  }, []);

  // --- AUTH HANDLERS ---
  const handleLogin = async (credentials: { email: string; password: string }) => {
    setIsAuthLoading(true);
    try {
      const loginRes = await apiClient.post<AuthSessionResponse>("/api/auth/login", credentials);
      if (!loginRes.user || !loginRes.token) throw new Error("The sign-in response was incomplete.");
      apiClient.setSessionToken(loginRes.token);
      const activeWorkspace = loginRes.workspaces.find((workspace) => workspace.organizationId === loginRes.activeWorkspaceId);
      setCurrentUser({ ...loginRes.user, role: activeWorkspace?.role ?? UserRole.ADMIN });
      setWorkspaces(loginRes.workspaces);
      setActiveWorkspaceId(loginRes.activeWorkspaceId);
      setIsLanding(false);

      if (!loginRes.activeWorkspaceId) {
        clearAppState();
        setApiError(null);
        return;
      }

      const state = await apiClient.get<AppState>("/api/state");
      applyAppState(state);
      setApiError(null);
    } catch (err: any) {
      console.error("Login API failed:", err);
      setCurrentUser(null);
      setApiError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignUp = async (details: { firstName: string; lastName: string; email: string; password: string }) => {
    setIsAuthLoading(true);
    try {
      const signUpRes = await apiClient.post<AuthSessionResponse>("/api/auth/signup", details);
      if (!signUpRes.user || !signUpRes.token) throw new Error("The account response was incomplete.");
      apiClient.setSessionToken(signUpRes.token);
      setCurrentUser({ ...signUpRes.user, role: UserRole.ADMIN });
      setWorkspaces(signUpRes.workspaces);
      setActiveWorkspaceId(signUpRes.activeWorkspaceId);
      clearAppState();
      setIsLanding(false);
      setApiError(null);
    } catch (err: any) {
      console.error("Sign-up API failed:", err);
      setApiError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreateWorkspace = async (input: WorkspaceSetupInput) => {
    try {
      const result = await apiClient.post<CreateWorkspaceResponse>("/api/workspaces", input);
      const nextWorkspaces = [...workspaces, result.membership].sort((first, second) => first.name.localeCompare(second.name));
      setWorkspaces(nextWorkspaces);
      setActiveWorkspaceId(result.membership.organizationId);
      setCurrentUser((user) => user ? { ...user, role: result.membership.role } : user);
      if (result.workspace.currency) {
        setSelectedCurrency(result.workspace.currency);
        localStorage.setItem("mip_currency", result.workspace.currency);
      }
      applyAppState(await apiClient.get<AppState>("/api/state"));
      setApiError(null);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Unable to create the workspace.";
      setApiError(message);
      throw err;
    }
  };

  const handleWorkspaceSelect = async (workspaceId: string) => {
    if (workspaceId === activeWorkspaceId) return;
    try {
      const result = await apiClient.post<{ workspace: WorkspaceMembership }>(`/api/workspaces/${workspaceId}/select`);
      setActiveWorkspaceId(result.workspace.organizationId);
      setCurrentUser((user) => user ? { ...user, role: result.workspace.role } : user);
      applyAppState(await apiClient.get<AppState>("/api/state"));
      setActiveTab("dashboard");
      setApiError(null);
    } catch (err: any) {
      console.error("Workspace switch failed:", err);
      setApiError(err instanceof Error ? err.message : "Unable to switch workspaces.");
    }
  };

  const handleInviteMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeWorkspaceId) return;
    try {
      const invitation = await apiClient.post<{ email: string; inviteUrl: string | null }>(
        `/api/workspaces/${activeWorkspaceId}/invitations`,
        { email: inviteEmail, role: inviteRole },
      );
      setInviteEmail("");
      setInviteFeedback(invitation.inviteUrl
        ? `Invitation created for ${invitation.email}. Development link: ${invitation.inviteUrl}`
        : `Invitation created for ${invitation.email}. Configure an outbox email worker before production delivery.`);
      setApiError(null);
    } catch (err: any) {
      setInviteFeedback(null);
      setApiError(err instanceof Error ? err.message : "Unable to create the invitation.");
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
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      clearAppState();
      setIsLanding(true);
      setIsAuthLoading(false);
      apiClient.clearSessionToken();
      localStorage.removeItem("mip_user_v1");
    }
  };

  // --- CRM LEAD MUTATORS ---
  const handleAddLead = async (newLead: Omit<Lead, "id" | "dateCreated" | "lastUpdated">) => {
    try {
      const updatedState = await apiClient.post<AppState>("/api/leads", newLead);
      applyAppState(updatedState);
      setApiError(null);
    } catch (err: any) {
      console.error("Failed to add lead on backend:", err);
      setApiError(err instanceof Error ? err.message : "Failed to add lead on the server.");
    }
  };

  const handleEditLead = async (leadId: string, updatedFields: Partial<Lead>) => {
    try {
      const updatedState = await apiClient.put<AppState>(`/api/leads/${leadId}`, updatedFields);
      applyAppState(updatedState);
      setApiError(null);
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, ...updatedFields });
      }
    } catch (err: any) {
      console.error("Failed to edit lead on backend:", err);
      setApiError(err instanceof Error ? err.message : "Failed to update the lead on the server.");
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const updatedState = await apiClient.delete<AppState>(`/api/leads/${leadId}`);
      applyAppState(updatedState);
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(null);
      }
      setApiError(null);
    } catch (err: any) {
      console.error("Failed to delete lead on backend:", err);
      setApiError(err instanceof Error ? err.message : "Failed to delete the lead on the server.");
    }
  };

  const handleClearDatastore = async () => {
    try {
      const updatedState = await apiClient.post<AppState>("/api/leads/clear-datastore");
      applyAppState(updatedState);
      setSelectedLead(null);
      setApiError(null);
    } catch (err: any) {
      console.error("Failed to clear datastore:", err);
      setApiError(err instanceof Error ? err.message : "Failed to clear CRM records on the server.");
    }
  };

  const handleUpdateLeadStage = async (leadId: string, targetStage: FunnelStage) => {
    try {
      const updatedState = await apiClient.patch<AppState>(`/api/leads/${leadId}/stage`, { stage: targetStage });
      applyAppState(updatedState);
      setApiError(null);

      // Refresh focus details in side nav dynamically
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, stage: targetStage });
      }
    } catch (err: any) {
      console.error("Failed to update stage on backend:", err);
      setApiError(err instanceof Error ? err.message : "Failed to update the lead stage on the server.");
    }
  };

  const handleLogLeadActivity = async (leadId: string, description: string, type: any) => {
    try {
      const updatedState = await apiClient.post<AppState>(`/api/leads/${leadId}/activities`, { type, description });
      applyAppState(updatedState);
      setApiError(null);
    } catch (err: any) {
      console.error("Failed to log activity on backend:", err);
      setApiError(err instanceof Error ? err.message : "Failed to save the activity on the server.");
    }
  };

  const handleCreateLeadFollowup = async (leadId: string, notes: string, scheduledTime: string, type: any, priority: any) => {
    try {
      const updatedState = await apiClient.post<AppState>(`/api/leads/${leadId}/followups`, {
        type,
        scheduledTime,
        notes,
        priority
      });
      applyAppState(updatedState);
      setApiError(null);
    } catch (err: any) {
      console.error("Failed to create followup on backend:", err);
      setApiError(err instanceof Error ? err.message : "Failed to save the follow-up on the server.");
    }
  };

  // --- APP LEVEL CAMPAIGN MUTATORS ---
  const handleAddNewCampaign = async (newCamp: Omit<Campaign, "id" | "leadsCount" | "conversions" | "clicks" | "impressions">) => {
    try {
      const updatedState = await apiClient.post<AppState>("/api/campaigns", newCamp);
      applyAppState(updatedState);
      setApiError(null);
    } catch (err: any) {
      console.error("Failed to add campaign on backend:", err);
      setApiError(err instanceof Error ? err.message : "Failed to create the campaign on the server.");
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

    try {
      const resData = await apiClient.post<{ text: string; isMock: boolean }>("/api/ai/query", {
        prompt: finalPrompt,
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
          <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest animate-pulse">Loading Marketing Intelligence Platform...</p>
          <span className="text-[11px] text-[#A78BFA]/50 block font-mono">MIP Enterprise Operating System</span>
        </div>
      </div>
    );
  }

  if (isLanding) {
    return <LandingPage onEnterApp={() => setIsLanding(false)} />;
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLogin} onSignUp={handleSignUp} onBackToLanding={() => setIsLanding(true)} error={apiError} />;
  }

  if (!activeWorkspaceId) {
    return <WorkspaceSetup onCreate={handleCreateWorkspace} onLogout={handleLogout} error={apiError} />;
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
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onWorkspaceSelect={handleWorkspaceSelect}
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
              {activeTab === "social" && "Social Media Content & Conversion Hub"}
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
          {apiError && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-400/25 bg-rose-950/30 px-4 py-3 text-xs text-rose-100">
              <span>{apiError}</span>
              <button onClick={() => setApiError(null)} className="text-rose-200 hover:text-white">Dismiss</button>
            </div>
          )}
          
          {/* 1. VIEW PORT: CORES DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Dynamic Sourced KPI Panels Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                
                <div className="bg-[#1F1830] border border-white/5 p-4 rounded-2xl space-y-1.5 relative overflow-hidden group">
                  <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">Total Leads</span>
                  <p className="text-2xl font-bold font-display text-white">{totalLeadsCount}</p>
                  <span className="text-[9px] text-[#C084FC] block font-mono">Total in system</span>
                </div>

                <div className="bg-[#1F1830] border border-white/5 p-4 rounded-2xl space-y-1.5 relative overflow-hidden group">
                  <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">Active Deals</span>
                  <p className="text-2xl font-bold font-display text-white">{activeLeadsCount}</p>
                  <span className="text-[9px] text-emerald-400 block font-mono">In progress</span>
                </div>

                <div className="bg-[#1F1830] border border-white/5 p-4 rounded-2xl space-y-1.5 relative overflow-hidden group">
                  <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">Won Deals</span>
                  <p className="text-2xl font-bold font-display text-emerald-400">{wonCount}</p>
                  <span className="text-[9px] text-gray-400 block font-mono">Successfully closed</span>
                </div>

                <div className="bg-[#1F1830] border border-white/5 p-4 rounded-2xl space-y-1.5 relative overflow-hidden group">
                  <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">Won Revenue</span>
                  <p className="text-2xl font-bold font-display text-[#C084FC]">{formatCurrency(grossARRResult)}</p>
                  <span className="text-[9px] text-emerald-400 block font-mono">Closed deal value</span>
                </div>

                <div className="bg-[#1F1830] border border-white/5 p-4 rounded-2xl space-y-1.5 col-span-2 md:col-span-1 border-l-[#7C3AED] relative overflow-hidden group">
                  <span className="text-[10px] text-gray-400 block uppercase font-mono tracking-wider">Win Rate</span>
                  <p className="text-2xl font-bold font-display text-[#C084FC]">{aggregateWinRatio}%</p>
                  <span className="text-[9px] text-gray-400 block font-mono">Won vs. Lost ratio</span>
                </div>

              </div>

              {/* Graphical trends breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalesFunnelWidget leads={leads} />
                <LeadSourceWidget leads={leads} />
              </div>

              {/* Lower panels: Recent tasks followups & dynamic CRM activity feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Pending Followups */}
                <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[#C084FC]" />
                      <h3 className="font-display font-semibold text-xs text-white">Upcoming Tasks & Follow-ups</h3>
                    </div>
                    <span className="font-mono text-[9px] bg-[#7C3AED]/10 text-[#C084FC] px-2 py-0.5 rounded-full">Calendar</span>
                  </div>

                  <div className="space-y-3">
                    {followups.filter(f => f.status === "Pending").length === 0 ? (
                      <p className="text-xs text-gray-500 py-4 text-center">No pending follow-ups scheduled.</p>
                    ) : (
                      followups.filter(f => f.status === "Pending").slice(0, 4).map((f) => (
                        <div key={f.id} className="p-3 bg-[#161122]/60 rounded-xl border border-white/5 flex justify-between items-center text-[11px] hover:border-white/10 transition-colors">
                          <div className="space-y-1">
                            <strong className="text-white block font-display">{f.leadName} ({f.type})</strong>
                            <span className="text-gray-400 block leading-tight">{f.notes}</span>
                            <span className="text-[9px] font-mono text-gray-500 block">Scheduled: {f.scheduledTime.replace("T", " ")}</span>
                          </div>
                          <span className={`text-[8.5px] px-2 py-0.5 rounded-full uppercase font-mono ${
                            f.priority === "High" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {f.priority}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Audit trail Activities log */}
                <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="flex items-center space-x-2">
                      <ActivityIcon className="w-4 h-4 text-[#C084FC]" />
                      <h3 className="font-display font-semibold text-xs text-white">Recent Activity Stream</h3>
                    </div>
                    <span className="font-mono text-[9px] text-[#94A3B8]">Live updates</span>
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

                {/* Primary Add Lead & Clear Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {leads.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to clear all transactional records? This will leave a completely empty pipeline.")) {
                          handleClearDatastore();
                        }
                      }}
                      title="Clear datastore records"
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Clear Data</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddLeadModal(true)}
                    className="px-4 py-2 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#7C3AED]/20 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Lead Profile
                  </button>
                </div>

              </div>

              {/* Lead creator dialog overlay */}
              {showAddLeadModal && (
                <div className="fixed inset-0 bg-[#0D0B14]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-[#161122] border border-[#7C3AED]/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
                    <div className="border-b border-[#1F1830] pb-3 flex justify-between items-center">
                      <div>
                        <h3 className="font-display font-semibold text-sm text-white">Create Lead Profile Entry</h3>
                        <p className="text-[11px] text-gray-400">Initialize a new sales prospect record in the MIP database.</p>
                      </div>
                      <button onClick={() => setShowAddLeadModal(false)} className="text-gray-400 hover:text-white text-xs p-1">✕</button>
                    </div>

                    {/* Standard creator fields */}
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const nameStr = fd.get("name") as string;
                      const companyStr = fd.get("company") as string;
                      const emailStr = fd.get("email") as string;
                      const phoneStr = fd.get("phone") as string;
                      const currentRate = (currencyRates[selectedCurrency] || currencyRates.KES).rate;
                      const rawInputVal = parseInt(fd.get("value") as string) || 1500;
                      const valNum = rawInputVal / currentRate;
                      const stageSel = fd.get("stage") as FunnelStage;
                      const sourceSel = fd.get("source") as LeadSource;
                      const scoreNum = 0;
                      
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
                          <input type="number" name="value" defaultValue={1500} className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white" />
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

              {/* Lead Editor dialog overlay */}
              {showEditLeadModal && editingLead && (
                <div className="fixed inset-0 bg-[#0D0B14]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-[#161122] border border-[#7C3AED]/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
                    <div className="border-b border-[#1F1830] pb-3 flex justify-between items-center">
                      <div>
                        <h3 className="font-display font-semibold text-sm text-white">Edit Lead Profile Entry</h3>
                        <p className="text-[11px] text-gray-400">Update contact info, pipeline stage, or sourcing details.</p>
                      </div>
                      <button onClick={() => setShowEditLeadModal(false)} className="text-gray-400 hover:text-white text-xs p-1">✕</button>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const currentRate = (currencyRates[selectedCurrency] || currencyRates.KES).rate;
                      const rawInputVal = parseInt(fd.get("value") as string) || 0;
                      const valNum = rawInputVal / currentRate;

                      handleEditLead(editingLead.id, {
                        name: fd.get("name") as string,
                        company: fd.get("company") as string,
                        email: fd.get("email") as string,
                        phone: fd.get("phone") as string,
                        value: valNum,
                        stage: fd.get("stage") as FunnelStage,
                        source: fd.get("source") as LeadSource,
                        leadScore: parseInt(fd.get("score") as string) || 50,
                        notes: fd.get("notes") as string || ""
                      });
                      setShowEditLeadModal(false);
                    }} className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">Contact Name</label>
                          <input type="text" name="name" defaultValue={editingLead.name} required className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">Company Entity</label>
                          <input type="text" name="company" defaultValue={editingLead.company} required className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">Primary Email Address</label>
                          <input type="email" name="email" defaultValue={editingLead.email} required className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">Phone contact</label>
                          <input type="tel" name="phone" defaultValue={editingLead.phone} required className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">Expected Deal Value ({selectedCurrency})</label>
                          <input type="number" name="value" defaultValue={Math.round((editingLead.value || 0) * (currencyRates[selectedCurrency] || currencyRates.KES).rate)} className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">Lead Score (0-100)</label>
                          <input type="number" min="0" max="100" name="score" defaultValue={editingLead.leadScore} className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">funnel placement</label>
                          <select name="stage" defaultValue={editingLead.stage} className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white focus:outline-none">
                            {Object.values(FunnelStage).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 uppercase">Acquisition Channel</label>
                          <select name="source" defaultValue={editingLead.source} className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white focus:outline-none">
                            {Object.values(LeadSource).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] text-gray-400 uppercase">Sourcing profile notes</label>
                          <textarea name="notes" defaultValue={editingLead.notes} className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-white h-16 resize-none" />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3.5 pt-3">
                        <button type="button" onClick={() => setShowEditLeadModal(false)} className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-xs">
                          Cancel
                        </button>
                        <button type="submit" className="px-5 py-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white rounded-xl text-xs font-semibold">
                          Update Profile
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Lead Delete Confirm dialog overlay */}
              {showDeleteConfirmModal && leadToDelete && (
                <div className="fixed inset-0 bg-[#0D0B14]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-[#161122] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
                    <div className="flex items-center space-x-3 text-rose-400">
                      <Trash2 className="w-6 h-6 shrink-0" />
                      <h3 className="font-display font-semibold text-base text-white">Delete Lead Profile</h3>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Are you sure you want to delete <strong className="text-white">{leadToDelete.name}</strong> from <strong className="text-white">{leadToDelete.company}</strong>? This action will permanently remove the record.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        onClick={() => {
                          setShowDeleteConfirmModal(false);
                          setLeadToDelete(null);
                        }} 
                        className="px-4 py-2 bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          handleDeleteLead(leadToDelete.id);
                          setShowDeleteConfirmModal(false);
                          setLeadToDelete(null);
                        }} 
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        Delete Lead
                      </button>
                    </div>
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
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F1830]">
                        {filteredGridLeads.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-gray-500 font-mono">
                              <div className="space-y-2">
                                <p className="text-gray-400">No leads found in pipeline.</p>
                                <button
                                  onClick={() => setShowAddLeadModal(true)}
                                  className="inline-flex items-center gap-1 text-[#C084FC] hover:underline text-xs"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Lead Profile Entry
                                </button>
                              </div>
                            </td>
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
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingLead(lead);
                                        setShowEditLeadModal(true);
                                      }}
                                      className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                      title="Edit lead profile"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLeadToDelete(lead);
                                        setShowDeleteConfirmModal(true);
                                      }}
                                      className="p-1.5 hover:bg-rose-500/20 rounded-lg text-gray-400 hover:text-rose-400 transition-colors"
                                      title="Delete lead profile"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
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
                          
                          <div className="flex items-center space-x-2">
                            {/* CRM dynamic matching evaluation score */}
                            <div className="bg-[#7C3AED]/10 text-center border border-[#7C3AED]/25 px-2.5 py-1 rounded-xl">
                              <span className="text-[8px] uppercase tracking-wide text-gray-400 block font-mono">Conversion Score</span>
                              <span className="font-mono text-xs font-bold text-[#C084FC]">{selectedLead.leadScore}%</span>
                            </div>

                            {/* Quick edit & delete buttons */}
                            <button
                              onClick={() => {
                                setEditingLead(selectedLead);
                                setShowEditLeadModal(true);
                              }}
                              className="p-1.5 bg-[#0D0B14] hover:bg-[#7C3AED]/20 border border-white/5 hover:border-[#7C3AED]/40 rounded-lg text-gray-400 hover:text-white transition-colors"
                              title="Edit lead"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setLeadToDelete(selectedLead);
                                setShowDeleteConfirmModal(true);
                              }}
                              className="p-1.5 bg-[#0D0B14] hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/40 rounded-lg text-gray-400 hover:text-rose-400 transition-colors"
                              title="Delete lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

          {/* VIEW PORT: SOCIAL MEDIA CONTENT & CONVERSION HUB */}
          {activeTab === "social" && (
            <SocialContentHub 
              leads={leads}
              formatCurrency={formatCurrency}
              selectedCurrency={selectedCurrency}
              onAddLeadFromSocial={(leadData) => {
                const currentRate = (currencyRates[selectedCurrency] || currencyRates.KES).rate;
                handleAddLead({
                  name: leadData.name || "Social Lead",
                  email: leadData.email || "social@lead.com",
                  phone: "+254 700 000 000",
                  company: leadData.company || "Social Network Lead",
                  stage: FunnelStage.QUALIFIED,
                  source: LeadSource.LINKEDIN,
                  value: (leadData.value || 1500) / currentRate,
                  leadScore: 85,
                  assignee: "usr-1",
                  notes: leadData.notes || "Converted from social comment intent."
                });
              }}
            />
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
              
              {currentUser.role === UserRole.ADMIN && (
                <div className="bg-[#1F1830] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div>
                    <h3 className="font-display font-semibold text-sm text-white">Invite team member</h3>
                    <p className="text-xs text-[#94A3B8]">Roles are assigned through workspace memberships, not browser-side profile switching.</p>
                  </div>
                  <form onSubmit={handleInviteMember} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                    <label className="space-y-1.5">
                      <span className="text-[10px] text-gray-400 uppercase font-mono">Work email</span>
                      <input type="email" required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@k10.com" className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-[#7C3AED]/60" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[10px] text-gray-400 uppercase font-mono">Workspace role</span>
                      <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as UserRole)} className="w-full bg-[#0D0B14] border border-white/5 py-2 px-3 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-[#7C3AED]/60">
                        <option value={UserRole.ADMIN}>Admin</option>
                        <option value={UserRole.MARKETING_MANAGER}>Marketing Manager</option>
                        <option value={UserRole.SALES_AGENT}>Sales Agent</option>
                      </select>
                    </label>
                    <button className="rounded-xl bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8B5CF6]">Send invite</button>
                  </form>
                  {inviteFeedback && <p className="break-all rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-100">{inviteFeedback}</p>}
                </div>
              )}

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

              {/* Database Administration: Clean Slate */}
              <div className="bg-[#1F1830] border border-rose-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
                <div>
                  <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                    <Trash className="w-4 h-4 text-rose-400" />
                    Datastore Administration & Clean Slate
                  </h3>
                  <p className="text-xs text-[#94A3B8]">Clear all transactional database records (leads, campaigns, follow-ups, activities) to operate with a clean slate.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
                  <div className="text-xs text-gray-400">
                    Active dataset: <span className="text-white font-mono font-semibold">{leads.length} Leads</span>, <span className="text-white font-mono font-semibold">{campaigns.length} Campaigns</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to clear all transactional data? This will give you a completely clean slate database.")) {
                        handleClearDatastore();
                      }
                    }}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Clear All Datastore Records
                  </button>
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
