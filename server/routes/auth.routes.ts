import { Router } from "express";
import { optionalAuth } from "../auth/middleware";
import { IdentityService } from "../modules/identity/identity.service";

const router = Router();
const identities = new IdentityService();
router.use(optionalAuth);

function tokenFromRequest(authorization?: string): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim() || null;
}

router.get("/me", async (request, response, next) => {
  try {
    if (!request.identity) {
      response.json({ user: null, workspaces: [], activeWorkspaceId: null });
      return;
    }
    const workspaces = await identities.getWorkspaces(request.identity.id);
    const requestedWorkspaceId = request.identity.activeOrganizationId;
    const activeWorkspaceId = workspaces.some((workspace) => workspace.organizationId === requestedWorkspaceId)
      ? requestedWorkspaceId
      : workspaces[0]?.organizationId ?? null;
    if (activeWorkspaceId && activeWorkspaceId !== requestedWorkspaceId) {
      await identities.selectWorkspace(request.identity, activeWorkspaceId);
    }
    const activeWorkspace = workspaces.find((workspace) => workspace.organizationId === activeWorkspaceId);
    response.json({
      user: {
        id: request.identity.id,
        name: request.identity.name,
        email: request.identity.email,
        avatar: request.identity.name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
        role: activeWorkspace?.role ?? null,
      },
      workspaces,
      activeWorkspaceId,
    });
  } catch (error) { next(error); }
});

router.post("/signup", async (request, response, next) => {
  try {
    const result = await identities.signUp(request.body ?? {});
    response.status(201).json(result);
  } catch (error) { next(error); }
});

router.post("/login", async (request, response, next) => {
  try {
    const result = await identities.login(request.body ?? {});
    const activeWorkspace = result.workspaces.find((workspace) => workspace.organizationId === result.activeWorkspaceId);
    response.json({ ...result, user: { ...result.user, role: activeWorkspace?.role ?? null } });
  } catch (error) { next(error); }
});

router.post("/logout", async (request, response, next) => {
  try {
    const token = tokenFromRequest(request.header("authorization"));
    if (token) await identities.revoke(token);
    response.status(204).end();
  } catch (error) { next(error); }
});

export default router;
