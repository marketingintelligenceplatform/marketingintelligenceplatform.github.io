var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  let aiClient = null;
  function getAiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      aiClient = new import_genai.GoogleGenAI({
        apiKey: apiKey || "MOCK_KEY",
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
    return aiClient;
  }
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/ai/query", async (req, res) => {
    const { prompt, dashboardState } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.json({
          text: `### \u{1F52E} [MIP AI LOCAL CORES] Predictive Insights (Sandbox Mode)

Our offline predictive analytics engine has processed your request based on the current sandbox CRM database.

#### **Key Analysis Outcomes**
* **Customer Lifetime Value (CLV)**: Dynamic projections estimate an average CLV of **$18,400** per Qualified Lead.
* **Funnel Velocity**: The major pipeline friction is discovered between **Proposal Sent** and **Negotiation**. The average duration here is **8.2 days**, with a degradation slope of $-12\\%$.
* **A/B Performance**: Your *Summer Retargeting* campaign has achieved **94.8% statistical confidence** over the control setup, indicating key significance ($p = 0.052$).

#### **Suggested Next Actions**
1. **Accelerate high probability deals**: Contact the top qualified leads (e.g., Sarah Jenkins, David Miller) who show a pipeline probability scoring $>85%$.
2. **Review Campaign ROI**: Double down on **LinkedIn Account Placements** as they yield a $4.8	imes$ ROI multiplier compared to cold organic sourcing.
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
          temperature: 0.7
        }
      });
      res.json({
        text: response.text || "Insight calculation complete. No output text was returned by model.",
        isMock: false
      });
    } catch (error) {
      console.error("MIP AI Error:", error);
      res.status(500).json({
        error: error?.message || "Internal server error occurred processing the intellectual insight query."
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MIP HOST] Express + Vite backend operational on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("FATAL: Failed to initiate HIP backend server: ", err);
});
//# sourceMappingURL=server.cjs.map
