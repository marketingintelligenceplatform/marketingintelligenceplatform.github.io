import type { NextFunction, Request, Response } from "express";
import type { Permission } from "./permissions";
import { hashSessionToken } from "./token";
import type { AuthIdentity, WorkspaceAuth } from "./types";
import { IdentityService } from "../modules/identity/identity.service";

export type AuthUser = WorkspaceAuth;

declare global {
  namespace Express {
    interface Request {
      identity?: AuthIdentity;
      auth?: AuthUser;
    }
  }
}

export { hashSessionToken } from "./token";

const identities = new IdentityService();

function extractBearerToken(request: Request): string | null {
  const value = request.header("authorization");
  if (!value?.startsWith("Bearer ")) return null;
  return value.slice("Bearer ".length).trim() || null;
}

function identityFromSession(session: Awaited<ReturnType<IdentityService["getSessionIdentity"]>>): AuthIdentity | null {
  if (!session) return null;
  return {
    id: session.id,
    sessionId: session.sessionId,
    name: [session.first_name, session.last_name].filter(Boolean).join(" "),
    email: session.email,
    activeOrganizationId: session.activeOrganizationId,
  };
}

export async function getAuthenticatedUser(token: string, organizationId?: string): Promise<AuthUser | null> {
  const session = await identities.getSessionIdentity(token);
  const identity = identityFromSession(session);
  if (!identity) return null;
  return identities.resolveWorkspace(identity, organizationId ?? identity.activeOrganizationId ?? "");
}

export async function optionalAuth(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearerToken(request);
    if (token) {
      const session = await identities.getSessionIdentity(token);
      const identity = identityFromSession(session);
      if (identity) {
        request.identity = identity;
        const requestedWorkspaceId = request.header("x-workspace-id")?.trim() || identity.activeOrganizationId;
        if (requestedWorkspaceId) request.auth = await identities.resolveWorkspace(identity, requestedWorkspaceId) ?? undefined;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function requireSession(request: Request, response: Response, next: NextFunction): void {
  if (!request.identity) {
    response.status(401).json({ error: "Authentication is required." });
    return;
  }
  next();
}

export function requireAuth(request: Request, response: Response, next: NextFunction): void {
  if (!request.auth) {
    response.status(request.identity ? 409 : 401).json({
      error: request.identity ? "Select a workspace before using this resource." : "Authentication is required.",
    });
    return;
  }
  next();
}

/** Resolves authorization from a workspace route parameter, never the browser body. */
export function requireWorkspaceParameter(parameterName = "workspaceId") {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      if (!request.identity) {
        response.status(401).json({ error: "Authentication is required." });
        return;
      }
      const organizationId = request.params[parameterName];
      if (!organizationId) {
        response.status(400).json({ error: "Workspace id is required." });
        return;
      }
      const auth = await identities.resolveWorkspace(request.identity, organizationId);
      if (!auth) {
        response.status(404).json({ error: "Workspace not found." });
        return;
      }
      request.auth = auth;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requirePermission(...permissions: Permission[]) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const granted = request.auth?.permissions ?? [];
    const allowed = granted.includes("*") || permissions.every((permission) => granted.includes(permission));
    if (!allowed) {
      response.status(403).json({ error: "Your role does not have permission for this action." });
      return;
    }
    next();
  };
}
