import { FunnelStage, LeadSource, Lead, Campaign, Activity, FollowUp, Notification, UserRole, CurrentUser } from "./types";

// Default Initial Data to seed the application
export const defaultLeads: Lead[] = [
  {
    id: "lead-1",
    name: "Sarah Jenkins",
    company: "Fintech Group Corp",
    email: "sjenkins@fintechgroup.com",
    phone: "+1 (555) 382-9102",
    value: 48500,
    stage: FunnelStage.NEGOTIATION,
    source: LeadSource.LINKEDIN,
    leadScore: 92,
    assignee: "Alex Cooper",
    dateCreated: "2026-05-12",
    lastUpdated: "2026-06-04",
    notes: "Very interested in real-time liquidity reporting dashboard. Reviewing pricing SLA tier options."
  },
  {
    id: "lead-2",
    name: "Michael Vance",
    company: "Nebula AI Platforms",
    email: "vance@nebulaai.io",
    phone: "+1 (555) 894-0394",
    value: 75000,
    stage: FunnelStage.PROPOSAL_SENT,
    source: LeadSource.LINKEDIN,
    leadScore: 89,
    assignee: "Alex Cooper",
    dateCreated: "2026-05-18",
    lastUpdated: "2026-06-03",
    notes: "Proposal submitted. Seeking full white-label analytics package. High revenue potential tier."
  },
  {
    id: "lead-3",
    name: "Emily Watson",
    company: "BioHealth Global Labs",
    email: "emily.w@biohealth.org",
    phone: "+44 20 7946 0958",
    value: 36000,
    stage: FunnelStage.WON,
    source: LeadSource.REFERRAL,
    leadScore: 98,
    assignee: "Sarah Connor",
    dateCreated: "2026-04-10",
    lastUpdated: "2026-05-30",
    notes: "Deal closed successfully on Premium Tier. Fully onboarded. Contract active."
  },
  {
    id: "lead-4",
    name: "David Miller",
    company: "TechCorp Logistics",
    email: "david.m@techcorplogistics.com",
    phone: "+1 (555) 732-9012",
    value: 23400,
    stage: FunnelStage.QUALIFIED,
    source: LeadSource.GOOGLE,
    leadScore: 78,
    assignee: "Sarah Connor",
    dateCreated: "2026-05-25",
    lastUpdated: "2026-06-02",
    notes: "Found us through google content on ML analytics. Qualified for Core Tier. Prefers monthly billing pipeline."
  },
  {
    id: "lead-5",
    name: "Robert Chen",
    company: "Nexus E-Commerce",
    email: "robert@nexusretail.com",
    phone: "+65 6743 0092",
    value: 12000,
    stage: FunnelStage.CONTACTED,
    source: LeadSource.WEBSITE,
    leadScore: 56,
    assignee: "Alex Cooper",
    dateCreated: "2026-05-28",
    lastUpdated: "2026-06-05",
    notes: "Filled out our website questionnaire. E-commerce conversion analytics. Scheduled quick discovery call."
  },
  {
    id: "lead-6",
    name: "Marcus Aurelius",
    company: "Antoninus Supply Chains",
    email: "marcus@antoninus.it",
    phone: "+39 06 876543",
    value: 18500,
    stage: FunnelStage.NEW_LEAD,
    source: LeadSource.COLD_OUTREACH,
    leadScore: 42,
    assignee: "Unassigned",
    dateCreated: "2026-06-04",
    lastUpdated: "2026-06-04",
    notes: "Cold outbound outreach responder. Interested in supply chain analytics dashboard. Needs qualifying info."
  },
  {
    id: "lead-7",
    name: "Karen Lee",
    company: "Pacific Coast Ventures",
    email: "karen.lee@pacificventures.com",
    phone: "+1 (555) 246-8102",
    value: 29000,
    stage: FunnelStage.NEGOTIATION,
    source: LeadSource.REFERRAL,
    leadScore: 84,
    assignee: "Sarah Connor",
    dateCreated: "2026-05-01",
    lastUpdated: "2026-06-01",
    notes: "Referral from board member. Discussing pilot setup. Requested custom enterprise integration quotes."
  },
  {
    id: "lead-8",
    name: "Jessica Vance",
    company: "Apex Creative Media",
    email: "jess@apexmedia.net",
    phone: "+1 (555) 304-9213",
    value: 9500,
    stage: FunnelStage.LOST,
    source: LeadSource.WEBSITE,
    leadScore: 15,
    assignee: "Sarah Connor",
    dateCreated: "2026-04-15",
    lastUpdated: "2026-05-05",
    notes: "Budget constraints. Decided to build self-managed local logs list. Flagged as lost."
  }
];

export const defaultCampaigns: Campaign[] = [
  {
    id: "camp-1",
    name: "Q2 LinkedIn Account-Based Marketing",
    description: "Highly targeted ads targeting Fintech and DevOps SaaS executive decision-makers.",
    budget: 20000,
    spent: 14500,
    leadsCount: 52,
    conversions: 14,
    status: "Active",
    clicks: 1840,
    impressions: 42000,
    dateStarted: "2026-04-01"
  },
  {
    id: "camp-2",
    name: "Google SEO Hub & Content Marketing",
    description: "Organic content positioning MIP as a premier Data Science and conversion intelligence leader.",
    budget: 8000,
    spent: 5200,
    leadsCount: 112,
    conversions: 18,
    status: "Active",
    clicks: 6500,
    impressions: 110000,
    dateStarted: "2026-03-10"
  },
  {
    id: "camp-3",
    name: "C-Level Executive Direct Roundtables",
    description: "Exclusive digital dinner seminars hosted with Ma Creatives Studio introducing premium B2B funnels.",
    budget: 15000,
    spent: 15000,
    leadsCount: 18,
    conversions: 8,
    status: "Completed",
    clicks: 350,
    impressions: 2500,
    dateStarted: "2026-02-15"
  },
  {
    id: "camp-4",
    name: "Winter Retargeting & Lookalikes",
    description: "Paid social retargeting of organic website traffic using custom web tracking pixels.",
    budget: 10000,
    spent: 2400,
    leadsCount: 22,
    conversions: 2,
    status: "Planned",
    clicks: 980,
    impressions: 15000,
    dateStarted: "2026-07-01"
  }
];

export const defaultFollowUps: FollowUp[] = [
  {
    id: "f-1",
    leadId: "lead-1",
    leadName: "Sarah Jenkins",
    type: "Meeting",
    scheduledTime: "2026-06-10T14:00",
    notes: "Align with secondary executive team on proposed pricing framework.",
    priority: "High",
    status: "Pending"
  },
  {
    id: "f-2",
    leadId: "lead-2",
    leadName: "Michael Vance",
    type: "Call",
    scheduledTime: "2026-06-08T10:30",
    notes: "Submit White-label option revisions. Final sign off expectations.",
    priority: "High",
    status: "Pending"
  },
  {
    id: "f-3",
    leadId: "lead-5",
    leadName: "Robert Chen",
    type: "Call",
    scheduledTime: "2026-06-06T11:00",
    notes: "Discovery call: Understand current e-commerce pipeline deficiencies.",
    priority: "Medium",
    status: "Pending"
  },
  {
    id: "f-4",
    leadId: "lead-4",
    leadName: "David Miller",
    type: "Email",
    scheduledTime: "2026-06-07T09:00",
    notes: "Send case study pdf showcasing Fintech optimization results.",
    priority: "Low",
    status: "Pending"
  }
];

export const defaultActivities: Activity[] = [
  {
    id: "act-1",
    type: "Meeting",
    leadId: "lead-1",
    leadName: "Sarah Jenkins",
    description: "Product demonstration. Presented real-time dashboard analytics integration.",
    performer: "Alex Cooper",
    timestamp: "2026-06-04T16:30Z"
  },
  {
    id: "act-2",
    type: "Note",
    leadId: "lead-2",
    leadName: "Michael Vance",
    description: "Requested full self-hosting and cloud container orchestration estimates.",
    performer: "Alex Cooper",
    timestamp: "2026-06-03T11:45Z"
  },
  {
    id: "act-3",
    type: "System Update",
    leadId: "lead-6",
    leadName: "Marcus Aurelius",
    description: "Lead auto-created via Inbound Cold Email Campaign responder parsing.",
    performer: "CRM Automation Daemon",
    timestamp: "2026-06-04T08:12Z"
  },
  {
    id: "act-4",
    type: "System Update",
    leadId: "lead-3",
    leadName: "Emily Watson",
    description: "Lead status changed: Transitioned to Won after validated payment.",
    performer: "Sarah Connor",
    timestamp: "2026-05-30T15:20Z"
  }
];

export const defaultNotifications: Notification[] = [
  {
    id: "n-1",
    title: "New High-Score Lead Sourced",
    message: "Marcus Aurelius from Antoninus Supply Chains scored as 42 via inbound parsing. Added to platform.",
    type: "info",
    isRead: false,
    time: "2026-06-05T08:15:00Z"
  },
  {
    id: "n-2",
    title: "SLA Deadline Imminent",
    message: "Negotiation review with Sarah Jenkins is scheduled in 5 days.",
    type: "warning",
    isRead: false,
    time: "2026-06-04T12:00:00Z"
  },
  {
    id: "n-3",
    title: "LinkedIn Campaign Threshold",
    message: "Q2 LinkedIn Account-Based Campaign spent has exceeded 70% threshold ($14,500).",
    type: "alert",
    isRead: true,
    time: "2026-06-03T09:30:00Z"
  },
  {
    id: "n-4",
    title: "Closed Won Milestone",
    message: "BioHealth Global contract finalized by Sarah Connor for $36,000.",
    type: "success",
    isRead: true,
    time: "2026-05-30T15:30:00Z"
  }
];

export const defaultUser: CurrentUser = {
  name: "Stephen Kimaru",
  email: "macreatives.global@gmail.com",
  role: UserRole.ADMIN,
  avatar: "SK"
};

// State key identifiers for LocalStorage persistence
const LEADS_KEY = "mip_leads_v1";
const CAMPAIGNS_KEY = "mip_campaigns_v1";
const FOLLOWUPS_KEY = "mip_followups_v1";
const ACTIVITIES_KEY = "mip_activities_v1";
const NOTIFICATIONS_KEY = "mip_notifications_v1";
const USER_KEY = "mip_user_v1";

// Safe loading from LocalStorage with fallback seeding
export function loadState() {
  try {
    const leadsJson = localStorage.getItem(LEADS_KEY);
    const campaignsJson = localStorage.getItem(CAMPAIGNS_KEY);
    const followupsJson = localStorage.getItem(FOLLOWUPS_KEY);
    const activitiesJson = localStorage.getItem(ACTIVITIES_KEY);
    const notificationsJson = localStorage.getItem(NOTIFICATIONS_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    return {
      leads: leadsJson ? JSON.parse(leadsJson) : defaultLeads,
      campaigns: campaignsJson ? JSON.parse(campaignsJson) : defaultCampaigns,
      followups: followupsJson ? JSON.parse(followupsJson) : defaultFollowUps,
      activities: activitiesJson ? JSON.parse(activitiesJson) : defaultActivities,
      notifications: notificationsJson ? JSON.parse(notificationsJson) : defaultNotifications,
      user: userJson ? JSON.parse(userJson) : defaultUser
    };
  } catch (error) {
    console.error("Failed to load local state from browser storage, fallback to defaults.", error);
    return {
      leads: defaultLeads,
      campaigns: defaultCampaigns,
      followups: defaultFollowUps,
      activities: defaultActivities,
      notifications: defaultNotifications,
      user: defaultUser
    };
  }
}

// Save back to LocalStorage
export function saveState(state: {
  leads: Lead[];
  campaigns: Campaign[];
  followups: FollowUp[];
  activities: Activity[];
  notifications: Notification[];
  user: CurrentUser;
}) {
  try {
    localStorage.setItem(LEADS_KEY, JSON.stringify(state.leads));
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(state.campaigns));
    localStorage.setItem(FOLLOWUPS_KEY, JSON.stringify(state.followups));
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(state.activities));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(state.notifications));
    localStorage.setItem(USER_KEY, JSON.stringify(state.user));
  } catch (error) {
    console.error("Failed to persist state back to LocalStorage:", error);
  }
}
