import { Router } from "express";
import {
  clearAllDataFromDb, createActivityInDb, createFollowUpInDb, createLeadInDb,
  deleteLeadFromDb, getLeadsFromDb, updateLeadInDb, updateLeadStageInDb,
} from "../../db/database";
import { requireAuth, requirePermission } from "../auth/middleware";
import { getCrmState } from "../services/crm-state.service";

const router = Router();
router.use(requireAuth);

router.get("/", requirePermission("leads:read"), async (request, response, next) => {
  try {
    response.json(await getLeadsFromDb(request.auth!.organizationId));
  } catch (error) { next(error); }
});

router.post("/clear-datastore", requirePermission("leads:delete"), async (request, response, next) => {
  try {
    await clearAllDataFromDb(request.auth!.organizationId);
    response.json(await getCrmState(request.auth!.organizationId));
  } catch (error) { next(error); }
});

router.post("/", requirePermission("leads:write"), async (request, response, next) => {
  try {
    await createLeadInDb(request.body, request.auth!.organizationId, request.auth!.id);
    response.status(201).json(await getCrmState(request.auth!.organizationId));
  } catch (error) { next(error); }
});

router.put("/:id", requirePermission("leads:write"), async (request, response, next) => {
  try {
    const updated = await updateLeadInDb(request.params.id, request.body, request.auth!.organizationId, request.auth!.id);
    if (!updated) { response.status(404).json({ error: "Lead not found." }); return; }
    response.json(await getCrmState(request.auth!.organizationId));
  } catch (error) { next(error); }
});

router.patch("/:id/stage", requirePermission("leads:write"), async (request, response, next) => {
  try {
    const stage = typeof request.body?.stage === "string" ? request.body.stage : "";
    if (!stage) { response.status(400).json({ error: "A target stage is required." }); return; }
    const updated = await updateLeadStageInDb(request.params.id, stage, request.auth!.organizationId, request.auth!.id);
    if (!updated) { response.status(404).json({ error: "Lead not found." }); return; }
    response.json(await getCrmState(request.auth!.organizationId));
  } catch (error) { next(error); }
});

router.delete("/:id", requirePermission("leads:delete"), async (request, response, next) => {
  try {
    const deleted = await deleteLeadFromDb(request.params.id, request.auth!.organizationId);
    if (!deleted) { response.status(404).json({ error: "Lead not found." }); return; }
    response.json(await getCrmState(request.auth!.organizationId));
  } catch (error) { next(error); }
});

router.post("/:id/activities", requirePermission("activities:write"), async (request, response, next) => {
  try {
    await createActivityInDb({ leadId: request.params.id, type: request.body?.type, description: request.body?.description }, request.auth!.organizationId, request.auth!.id);
    response.status(201).json(await getCrmState(request.auth!.organizationId));
  } catch (error) { next(error); }
});

router.post("/:id/followups", requirePermission("followups:write"), async (request, response, next) => {
  try {
    if (!request.body?.scheduledTime || !request.body?.notes) {
      response.status(400).json({ error: "A follow-up date and notes are required." }); return;
    }
    await createFollowUpInDb({ ...request.body, leadId: request.params.id }, request.auth!.organizationId, request.auth!.id);
    response.status(201).json(await getCrmState(request.auth!.organizationId));
  } catch (error) { next(error); }
});

export default router;
