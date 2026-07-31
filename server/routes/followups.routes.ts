import { Router } from "express";
import { createFollowUpInDb, getFollowUpsFromDb } from "../../db/database";
import { requireAuth, requirePermission } from "../auth/middleware";

const router = Router();
router.use(requireAuth);
router.get("/", requirePermission("followups:read"), async (request, response, next) => {
  try { response.json(await getFollowUpsFromDb(request.auth!.organizationId)); } catch (error) { next(error); }
});
router.post("/", requirePermission("followups:write"), async (request, response, next) => {
  try {
    if (!request.body?.leadId || !request.body?.scheduledTime || !request.body?.notes) {
      response.status(400).json({ error: "leadId, scheduledTime and notes are required." }); return;
    }
    await createFollowUpInDb(request.body, request.auth!.organizationId, request.auth!.id);
    response.status(201).json(await getFollowUpsFromDb(request.auth!.organizationId));
  } catch (error) { next(error); }
});
export default router;
