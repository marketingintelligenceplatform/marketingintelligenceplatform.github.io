import express from "express";
import path from "path";
import { promises as fs } from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Import types and default mock data for backing in-memory CRM store
import { FunnelStage, LeadSource, Lead, Campaign, Activity, FollowUp, Notification, UserRole, CurrentUser } from "./src/types";
import { defaultLeads, defaultCampaigns, defaultFollowUps, defaultActivities, defaultNotifications } from "./src/dataStore";

dotenv.config();

interface BackendState {
  leads: Lead[];
  campaigns: Campaign[];
  followups: FollowUp[];
  activities: Activity[];
  notifications: Notification[];
}

// In-Memory Database Store for the MVP
let backendState: BackendState = {
  leads: JSON.parse(JSON.stringify(defaultLeads)) as Lead[],
  campaigns: JSON.parse(JSON.stringify(defaultCampaigns)) as Campaign[],
  followups: JSON.parse(JSON.stringify(defaultFollowUps)) as FollowUp[],
  activities: JSON.parse(JSON.stringify(defaultActivities)) as Activity[],
  notifications: JSON.parse(JSON.stringify(defaultNotifications)) as Notification[]
};

let backendUser: CurrentUser | null = null;

const dataFilePath = process.env.MIP_DATA_FILE
  ? path.resolve(process.env.MIP_DATA_FILE)
  : path.join(process.cwd(), "data", "mip-db.json");

async function persistBackendState() {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, `${JSON.stringify(backendState, null, 2)}\n`, "utf-8");
}

async function loadBackendState() {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });

  try {
    const raw = await fs.readFile(dataFilePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<BackendState>;
    backendState = {
      leads: Array.isArray(parsed.leads) ? parsed.leads : backendState.leads,
      campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : backendState.campaigns,
      followups: Array.isArray(parsed.followups) ? parsed.followups : backendState.followups,
      activities: Array.isArray(parsed.activities) ? parsed.activities : backendState.activities,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : backendState.notifications
    };
  } catch {
    await persistBackendState();
  }
}

async function startServer() {
  await loadBackendState();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const isAllowedOrigin =
      !requestOrigin || allowedOrigins.length === 0 || allowedOrigins.includes(requestOrigin);

    if (requestOrigin && isAllowedOrigin) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    } else if (!requestOrigin && allowedOrigins.length === 0) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }

    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (req.method === "OPTIONS") {
      return res.status(204).send();
    }

    next();
  });

  // Lazy initializer to safety handle missing environment keys on load
  let aiClient: GoogleGenAI | null = null;
  function getAiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      aiClient = new GoogleGenAI({
        apiKey: apiKey || "MOCK_KEY",
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
    return aiClient;
  }

  // --- AUTH ENDPOINTS ---
  app.get("/api/auth/me", (req, res) => {
    res.json({ user: backendUser });
  });

  app.post("/api/auth/login", (req, res) => {
    const { name, email, role } = req.body;
    backendUser = {
      name: name || "Stephen Kimaru",
      email: email || "macreatives.global@gmail.com",
      role: role || UserRole.ADMIN,
      avatar: (name || "Stephen Kimaru").split(" ").map((n: string) => n[0]).join("").toUpperCase()
    };
    res.json({ user: backendUser });
  });

  app.post("/api/auth/logout", (req, res) => {
    backendUser = null;
    res.json({ success: true });
  });

  // --- CRM STATE ENDPOINTS ---
  app.get("/api/state", (req, res) => {
    res.json(backendState);
  });

  app.put("/api/state", async (req, res) => {
    const { leads, campaigns, followups, activities, notifications } = req.body;
    if (leads) backendState.leads = leads;
    if (campaigns) backendState.campaigns = campaigns;
    if (followups) backendState.followups = followups;
    if (activities) backendState.activities = activities;
    if (notifications) backendState.notifications = notifications;
    await persistBackendState();
    res.json(backendState);
  });

  app.get("/api/leads", (req, res) => {
    res.json(backendState.leads);
  });

  app.post("/api/leads", async (req, res) => {
    const leadData = req.body;
    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      dateCreated: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0]
    };

    backendState.leads = [newLead, ...backendState.leads];

    // Log system activity update
    const auditLog: Activity = {
      id: `act-${Date.now()}`,
      type: "System Update",
      leadId: newLead.id,
      leadName: newLead.name,
      description: `New lead created at stage "${newLead.stage}" with dynamic contract score of ${newLead.leadScore}.`,
      performer: backendUser?.name || "System Automation",
      timestamp: new Date().toISOString()
    };
    backendState.activities = [auditLog, ...backendState.activities];

    // Send push notification
    const newNotify: Notification = {
      id: `n-${Date.now()}`,
      title: "Inbound Sourcing Alert",
      message: `${newLead.company} (${newLead.name}) generated dynamic CRM scores of ${newLead.leadScore}/100.`,
      type: "success",
      isRead: false,
      time: new Date().toISOString()
    };
    backendState.notifications = [newNotify, ...backendState.notifications];

    await persistBackendState();
    res.json(backendState);
  });

  app.patch("/api/leads/:id/stage", async (req, res) => {
    const { id } = req.params;
    const { stage } = req.body;

    const previous = backendState.leads.find(l => l.id === id);
    if (!previous) {
      return res.status(404).json({ error: "Lead not found in CRM datastore." });
    }

    const oldStage = previous.stage;
    previous.stage = stage;
    previous.lastUpdated = new Date().toISOString().split("T")[0];

    // Push audit activity log
    const auditLog: Activity = {
      id: `act-${Date.now()}`,
      type: "System Update",
      leadId: id,
      leadName: previous.name,
      description: `Transitioned funnel stage path from [${oldStage}] to [${stage}].`,
      performer: backendUser?.name || "System Automation",
      timestamp: new Date().toISOString()
    };
    backendState.activities = [auditLog, ...backendState.activities];

    // Send push notification
    const newNotify: Notification = {
      id: `n-${Date.now()}`,
      title: "Funnel Stage Updated",
      message: `${previous.name}'s stage was progressed to "${stage}" by ${backendUser?.name || "System"}.`,
      type: "info",
      isRead: false,
      time: new Date().toISOString()
    };
    backendState.notifications = [newNotify, ...backendState.notifications];

    await persistBackendState();
    res.json(backendState);
  });

  app.post("/api/leads/:id/activities", async (req, res) => {
    const { id } = req.params;
    const { type, description } = req.body;

    const lead = backendState.leads.find(l => l.id === id);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found in CRM datastore." });
    }

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: type || "Note",
      leadId: id,
      leadName: lead.name,
      description: description || "",
      performer: backendUser?.name || "System Agent",
      timestamp: new Date().toISOString()
    };

    backendState.activities = [newActivity, ...backendState.activities];
    await persistBackendState();
    res.json(backendState);
  });

  app.post("/api/leads/:id/followups", async (req, res) => {
    const { id } = req.params;
    const { type, scheduledTime, notes, priority } = req.body;

    const lead = backendState.leads.find(l => l.id === id);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found in CRM datastore." });
    }

    const newFollowUp: FollowUp = {
      id: `f-${Date.now()}`,
      leadId: id,
      leadName: lead.name,
      type: type || "Call",
      scheduledTime: scheduledTime || new Date().toISOString().slice(0, 16),
      notes: notes || "",
      priority: priority || "Medium",
      status: "Pending"
    };

    backendState.followups = [newFollowUp, ...backendState.followups];

    // Add system activity log
    const auditLog: Activity = {
      id: `act-${Date.now()}`,
      type: "System Update",
      leadId: id,
      leadName: lead.name,
      description: `Scheduled a new follow-up activity: ${newFollowUp.type} - "${newFollowUp.notes}" on ${newFollowUp.scheduledTime}.`,
      performer: backendUser?.name || "System Automation",
      timestamp: new Date().toISOString()
    };
    backendState.activities = [auditLog, ...backendState.activities];

    await persistBackendState();
    res.json(backendState);
  });

  app.get("/api/campaigns", (req, res) => {
    res.json(backendState.campaigns);
  });

  app.post("/api/campaigns", async (req, res) => {
    const campaignData = req.body;
    const newCampaign: Campaign = {
      ...campaignData,
      id: `camp-${Date.now()}`,
      conversions: 0,
      leadsCount: 0,
      clicks: 0,
      impressions: 0,
      dateStarted: new Date().toISOString().split("T")[0]
    };

    backendState.campaigns = [newCampaign, ...backendState.campaigns];

    // Add system notification for campaign launch
    const notification: Notification = {
      id: `n-${Date.now()}`,
      title: "New Marketing Campaign",
      message: `Campaign "${newCampaign.name}" initiated with budget threshold $${newCampaign.budget}.`,
      type: "info",
      isRead: false,
      time: new Date().toISOString()
    };
    backendState.notifications = [notification, ...backendState.notifications];

    await persistBackendState();
    res.json(backendState);
  });

  app.get("/api/analytics/summary", (req, res) => {
    const totalLeads = backendState.leads.length;
    const activeLeads = backendState.leads.filter(l => l.stage !== FunnelStage.WON && l.stage !== FunnelStage.LOST).length;
    const wonDeals = backendState.leads.filter(l => l.stage === FunnelStage.WON).length;
    const revenueGenerated = backendState.leads.filter(l => l.stage === FunnelStage.WON).reduce((sum, l) => sum + l.value, 0);

    const expectedPipelineValue = backendState.leads.reduce((sum, l) => {
      let probability = 0.1;
      if (l.stage === FunnelStage.CONTACTED) probability = 0.2;
      else if (l.stage === FunnelStage.QUALIFIED) probability = 0.4;
      else if (l.stage === FunnelStage.PROPOSAL_SENT) probability = 0.6;
      else if (l.stage === FunnelStage.NEGOTIATION) probability = 0.8;
      else if (l.stage === FunnelStage.WON) probability = 1.0;
      else if (l.stage === FunnelStage.LOST) probability = 0.0;
      return sum + (l.value * probability);
    }, 0);

    const leadScoreSum = backendState.leads.reduce((sum, l) => sum + l.leadScore, 0);
    const averageLeadScore = totalLeads > 0 ? Math.round(leadScoreSum / totalLeads) : 0;

    res.json({
      totalLeads,
      activeLeads,
      wonDeals,
      revenueGenerated,
      expectedPipelineValue,
      averageLeadScore,
      leadsCountBySource: backendState.leads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Direct endpoint to safely run marketing queries using server-side Gemini
  app.post("/api/ai/query", async (req, res) => {
    const { prompt, dashboardState } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;

      // Handle missing API Key gracefully or if it is the placeholder string
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.json({
          text: `### 🔮 [MIP AI LOCAL CORES] Predictive Insights (Sandbox Mode)

Our offline predictive analytics engine has processed your request based on the current sandbox CRM database.

#### **Key Analysis Outcomes**
* **Customer Lifetime Value (CLV)**: Dynamic projections estimate an average CLV of **$18,400** per Qualified Lead.
* **Funnel Velocity**: The major pipeline friction is discovered between **Proposal Sent** and **Negotiation**. The average duration here is **8.2 days**, with a degradation slope of $-12\\%$.
* **A/B Performance**: Your *Summer Retargeting* campaign has achieved **94.8% statistical confidence** over the control setup, indicating key significance ($p = 0.052$).

#### **Suggested Next Actions**
1. **Accelerate high probability deals**: Contact the top qualified leads (e.g., Sarah Jenkins, David Miller) who show a pipeline probability scoring $>85\%$.
2. **Review Campaign ROI**: Double down on **LinkedIn Account Placements** as they yield a $4.8\times$ ROI multiplier compared to cold organic sourcing.
3. **Upgrade Engine**: Assign a valid \`GEMINI_API_KEY\` in your Secrets Configuration to unlock live, customized AI conversations reflecting real-time updates.`,
          isMock: true
        });
      }

      const ai = getAiClient();
      const systemInstruction = `You are the Marketing Intelligence Platform (MIP) AI Core Agent, built for Ma Creatives Studio (founded by Stephen Kimaru). 
You reside on the secure backend of MIP. Below are the current real-time metrics of the enterprise sales and marketing funnel:
- Total Leads Tracking: ${dashboardState?.totalLeads || 154}
- Active Pipeline Count: ${dashboardState?.activeLeads || 88}
- Funnel Lead Conversion: ${dashboardState?.conversionRate || "14.2%"}
- Successful Wins (Closed Won): ${dashboardState?.wonDeals || 18}
- Captured Revenue Portfolio: ${dashboardState?.revenueGenerated || "$84,500"}

Provide structured, elegant, professional business intelligence and predictive analysis. Use rich Markdown elements:
1. Bullet points and section headers for clear formatting.
2. Bold text for key metric coefficients.
3. Standard mathematical formulas (e.g. A/B confidence equations or linear slopes) where useful.
Instruct the user on operational choices and crm metrics with absolute clarity, highlighting lead priority and campaign optimization.
Sound like an advanced premium SaaS advisory co-pilot. Keep replies concise and professional (within 2-4 key paragraphs).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt || "Analyze this pipeline state and give me a high-level summary of lead performance and next steps.",
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({
        text: response.text || "Insight calculation complete. No output text was returned by model.",
        isMock: false
      });
    } catch (error: any) {
      console.error("MIP AI Error:", error);
      res.status(500).json({
        error: error?.message || "Internal server error occurred processing the intellectual insight query."
      });
    }
  });

  // Vite middleware setup for client asset serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MIP HOST] Express + Vite backend operational on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL: Failed to initiate HIP backend server: ", err);
});
