import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, requirePermission } from "../auth/middleware";
import { optionalText } from "../shared/validation";
import { getAiDashboardContext } from "../services/ai-context.service";

const router = Router();
router.use(requireAuth);

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return aiClient;
}

router.post("/query", requirePermission("ai:query"), async (req, res) => {
  try {
    const prompt = optionalText(req.body?.prompt, "Prompt", 2_000)
      ?? "Analyze this pipeline state and give me a high-level summary of lead performance and next steps.";
    const dashboardState = await getAiDashboardContext(req.auth!.organizationId);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({
        text: `### AI assistant is not configured

MIP can still show the current workspace totals: **${dashboardState.totalLeads} leads**, **${dashboardState.activeLeads} active**, **${dashboardState.wonDeals} won**, and **${dashboardState.revenueGenerated} in closed-won value**.

Add a valid \`GEMINI_API_KEY\` to enable generated analysis and recommendations. Until then, MIP will not invent campaign, conversion, or customer insights.`,
        isMock: true,
      });
    }

    const ai = getAiClient();
    const systemInstruction = `You are the Marketing Intelligence Platform (MIP) AI Core Agent, built for the Marketing Intelligence Platform (MIP) Enterprise Operating System.
You reside on the secure backend of MIP. Below are the current real-time metrics of the enterprise sales and marketing funnel:
- Total Leads Tracking: ${dashboardState.totalLeads}
- Active Pipeline Count: ${dashboardState.activeLeads}
- Funnel Lead Conversion: ${dashboardState.conversionRate}
- Successful Wins (Closed Won): ${dashboardState.wonDeals}
- Captured Revenue Portfolio: ${dashboardState.revenueGenerated}

Provide structured, elegant, professional business intelligence and predictive analysis. Use rich Markdown elements:
1. Bullet points and section headers for clear formatting.
2. Bold text for key metric coefficients.
3. Standard mathematical formulas where useful.
Instruct the user on operational choices and CRM metrics with absolute clarity, highlighting lead priority and campaign optimization.
Sound like an advanced premium SaaS advisory co-pilot. Keep replies concise and professional (within 2-4 key paragraphs).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { systemInstruction, temperature: 0.7 },
    });

    res.json({
      text: response.text || "Insight calculation complete. No output text was returned by model.",
      isMock: false,
    });
  } catch (error: any) {
    console.error("MIP AI Error:", error);
    res.status(500).json({
      error: error?.message || "Internal server error occurred processing the intellectual insight query.",
    });
  }
});

export default router;
