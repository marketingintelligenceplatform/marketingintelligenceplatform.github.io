import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
