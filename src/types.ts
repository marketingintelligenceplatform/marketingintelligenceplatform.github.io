export enum FunnelStage {
  NEW_LEAD = "New Lead",
  CONTACTED = "Contacted",
  QUALIFIED = "Qualified",
  PROPOSAL_SENT = "Proposal Sent",
  NEGOTIATION = "Negotiation",
  WON = "Won",
  LOST = "Lost"
}

export enum LeadSource {
  WEBSITE = "Website Referral",
  LINKEDIN = "LinkedIn Inbound",
  GOOGLE = "Google Organic/SEO",
  REFERRAL = "Partner Referral",
  COLD_OUTREACH = "Outbound Outreach"
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number; // estimated pipeline dollar value
  stage: FunnelStage;
  source: LeadSource;
  leadScore: number; // score calculated dynamically out of 100
  assignee: string; // sales agent assignment
  dateCreated: string;
  lastUpdated: string;
  notes: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  budget: number;
  spent: number;
  leadsCount: number;
  conversions: number;
  status: "Active" | "Completed" | "Planned";
  clicks: number;
  impressions: number;
  dateStarted: string;
}

export interface Activity {
  id: string;
  type: "Email" | "Phone Call" | "Meeting" | "System Update" | "Note";
  leadId: string;
  leadName: string;
  description: string;
  performer: string;
  timestamp: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  leadName: string;
  type: "Call" | "Email" | "Meeting" | "Review";
  scheduledTime: string;
  notes: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "Completed" | "Overdue";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "alert";
  isRead: boolean;
  time: string;
}

export enum UserRole {
  ADMIN = "Admin",
  MARKETING_MANAGER = "Marketing Manager",
  SALES_AGENT = "Sales Agent"
}

export interface CurrentUser {
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}
