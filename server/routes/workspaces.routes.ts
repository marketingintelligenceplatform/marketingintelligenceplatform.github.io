import { Router } from "express";
import { requirePermission, requireSession, requireWorkspaceParameter } from "../auth/middleware";
import { IdentityService } from "../modules/identity/identity.service";
import { WorkspaceService } from "../modules/workspaces/workspace.service";

const router = Router();
const identities = new IdentityService();
const workspaces = new WorkspaceService();

router.get("/", requireSession, async (request, response, next) => {
  try { response.json(await identities.getWorkspaces(request.identity!.id)); } catch (error) { next(error); }
});

router.post("/", requireSession, async (request, response, next) => {
  try { response.status(201).json(await workspaces.createWorkspace(request.identity!, request.body ?? {})); } catch (error) { next(error); }
});

router.post("/:workspaceId/select", requireSession, async (request, response, next) => {
  try { response.json({ workspace: await identities.selectWorkspace(request.identity!, request.params.workspaceId) }); } catch (error) { next(error); }
});

router.patch("/:workspaceId", requireWorkspaceParameter(), requirePermission("users:manage"), async (request, response, next) => {
  try { response.json(await workspaces.updateWorkspace(request.auth!, request.body ?? {})); } catch (error) { next(error); }
});

router.get("/:workspaceId/members", requireWorkspaceParameter(), requirePermission("users:manage"), async (request, response, next) => {
  try { response.json(await workspaces.listMembers(request.auth!)); } catch (error) { next(error); }
});

router.post("/:workspaceId/invitations", requireWorkspaceParameter(), requirePermission("users:manage"), async (request, response, next) => {
  try { response.status(201).json(await workspaces.invite(request.auth!, request.body ?? {})); } catch (error) { next(error); }
});

export default router;
