import { Router } from "express";
import { requireAuth, requirePermission } from "../auth/middleware";
import { WorkspaceService } from "../modules/workspaces/workspace.service";

const router = Router();
const workspaces = new WorkspaceService();
router.use(requireAuth, requirePermission("users:manage"));

/** Compatibility member list. New clients should use /api/workspaces/:id/members. */
router.get("/", async (request, response, next) => {
  try { response.json(await workspaces.listMembers(request.auth!)); } catch (error) { next(error); }
});

/** Passwords are never created by workspace administrators. */
router.post("/", (_request, response) => {
  response.status(410).json({
    error: "Create members with POST /api/workspaces/:workspaceId/invitations so they can choose their own password.",
  });
});

export default router;
