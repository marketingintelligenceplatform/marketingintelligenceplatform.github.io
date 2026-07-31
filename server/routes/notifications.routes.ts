import { Router } from "express";
import { createNotificationInDb, getNotificationsFromDb } from "../../db/database";
import { requireAuth, requirePermission } from "../auth/middleware";

const router = Router();
router.use(requireAuth);
router.get("/", requirePermission("notifications:read"), async (request, response, next) => {
  try { response.json(await getNotificationsFromDb(request.auth!.organizationId)); } catch (error) { next(error); }
});
router.post("/", requirePermission("notifications:write"), async (request, response, next) => {
  try {
    if (!request.body?.title || !request.body?.message) { response.status(400).json({ error: "title and message are required." }); return; }
    await createNotificationInDb(request.body, request.auth!.organizationId);
    response.status(201).json(await getNotificationsFromDb(request.auth!.organizationId));
  } catch (error) { next(error); }
});
export default router;
