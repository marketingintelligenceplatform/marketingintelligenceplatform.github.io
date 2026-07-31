import { Router } from "express";
import { createCampaignInDb, getCampaignsFromDb } from "../../db/database";
import { requireAuth, requirePermission } from "../auth/middleware";
import { getCrmState } from "../services/crm-state.service";

const router = Router();
router.use(requireAuth);

router.get("/", requirePermission("campaigns:read"), async (request, response, next) => {
  try { response.json(await getCampaignsFromDb(request.auth!.organizationId)); } catch (error) { next(error); }
});

router.post("/", requirePermission("campaigns:write"), async (request, response, next) => {
  try {
    if (!String(request.body?.name ?? "").trim()) { response.status(400).json({ error: "Campaign name is required." }); return; }
    await createCampaignInDb(request.body, request.auth!.organizationId);
    response.status(201).json(await getCrmState(request.auth!.organizationId));
  } catch (error) { next(error); }
});

export default router;
