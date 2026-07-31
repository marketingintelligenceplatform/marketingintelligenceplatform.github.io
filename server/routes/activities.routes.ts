import { Router } from "express";
import { createActivityInDb, getActivitiesFromDb } from "../../db/database";
import { requireAuth, requirePermission } from "../auth/middleware";

const router = Router();
router.use(requireAuth);
router.get("/", requirePermission("activities:read"), async (request, response, next) => {
  try { response.json(await getActivitiesFromDb(request.auth!.organizationId)); } catch (error) { next(error); }
});
router.post("/", requirePermission("activities:write"), async (request, response, next) => {
  try {
    if (!request.body?.leadId || !request.body?.description) { response.status(400).json({ error: "leadId and description are required." }); return; }
    await createActivityInDb(request.body, request.auth!.organizationId, request.auth!.id);
    response.status(201).json(await getActivitiesFromDb(request.auth!.organizationId));
  } catch (error) { next(error); }
});
export default router;
