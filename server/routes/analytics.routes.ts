import { Router } from "express";
import { getLeadsFromDb, getPipelineStagesFromDb } from "../../db/database";
import { requireAuth, requirePermission } from "../auth/middleware";

const router = Router();
router.use(requireAuth);
router.get("/summary", requirePermission("analytics:read"), async (request, response, next) => {
  try {
    const [leads, stages] = await Promise.all([getLeadsFromDb(request.auth!.organizationId), getPipelineStagesFromDb(request.auth!.organizationId)]);
    const probabilityByName = new Map(stages.map((stage) => [stage.name, stage.winProbability]));
    const wonDeals = leads.filter((lead) => lead.stage === "Won");
    response.json({
      totalLeads: leads.length,
      activeLeads: leads.filter((lead) => !["Won", "Lost"].includes(lead.stage)).length,
      wonDeals: wonDeals.length,
      revenueGenerated: wonDeals.reduce((sum, lead) => sum + lead.value, 0),
      expectedPipelineValue: leads.reduce((sum, lead) => sum + lead.value * (probabilityByName.get(lead.stage) ?? 0), 0),
      averageLeadScore: leads.length ? Math.round(leads.reduce((sum, lead) => sum + lead.leadScore, 0) / leads.length) : 0,
      leadsCountBySource: leads.reduce<Record<string, number>>((counts, lead) => {
        counts[lead.source || "Unspecified"] = (counts[lead.source || "Unspecified"] ?? 0) + 1;
        return counts;
      }, {}),
    });
  } catch (error) { next(error); }
});
export default router;
