import { Router } from "express";
import { getPipelineStagesFromDb } from "../../db/database";
import { requireAuth, requirePermission } from "../auth/middleware";
import { getCrmState } from "../services/crm-state.service";

const router = Router();
router.use(requireAuth);

router.get("/pipeline-stages", requirePermission("pipeline:read"), async (request, response, next) => {
  try { response.json(await getPipelineStagesFromDb(request.auth!.organizationId)); } catch (error) { next(error); }
});
router.get("/state", requirePermission("leads:read"), async (request, response, next) => {
  try { response.json(await getCrmState(request.auth!.organizationId)); } catch (error) { next(error); }
});

export default router;
