import { randomBytes } from "node:crypto";
import { pool } from "../../config/database";
import { hashPassword, verifyPassword } from "../../auth/password";
import { hashSessionToken } from "../../auth/token";
import { AppError } from "../../shared/errors";
import { email, optionalText, password, requiredText } from "../../shared/validation";
import { IdentityRepository, type SessionIdentity, type UserRecord, type WorkspaceMembership } from "./identity.repository";
import type { AuthIdentity, WorkspaceAuth } from "../../auth/types";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface AuthPayload {
  user: PublicUser;
  workspaces: WorkspaceMembership[];
  activeWorkspaceId: string | null;
  token: string;
}

function publicUser(user: Pick<UserRecord, "id" | "first_name" | "last_name" | "email">): PublicUser {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return {
    id: user.id,
    name,
    email: user.email,
    avatar: name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
  };
}

export class IdentityService {
  constructor(private readonly repository = new IdentityRepository()) {}

  async signUp(input: Record<string, unknown>): Promise<AuthPayload> {
    const firstName = requiredText(input.firstName, "First name", 100);
    const lastName = optionalText(input.lastName, "Last name", 100);
    const normalizedEmail = email(input.email);
    const rawPassword = password(input.password);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (await this.repository.findUserByEmail(client, normalizedEmail)) {
        throw new AppError("An account with this email already exists. Sign in instead.", 409);
      }
      const user = await this.repository.createUser(client, {
        firstName,
        lastName,
        email: normalizedEmail,
        passwordHash: await hashPassword(rawPassword),
      });
      const token = randomBytes(48).toString("base64url");
      await this.repository.createSession(client, user.id, hashSessionToken(token), null);
      await client.query("COMMIT");
      return { user: publicUser(user), workspaces: [], activeWorkspaceId: null, token };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async login(input: Record<string, unknown>): Promise<AuthPayload> {
    const normalizedEmail = email(input.email);
    const rawPassword = requiredText(input.password, "Password", 256);
    const client = await pool.connect();
    try {
      const user = await this.repository.findUserByEmail(client, normalizedEmail);
      if (!user || !user.is_active || !(await verifyPassword(rawPassword, user.password_hash))) {
        throw new AppError("Invalid email or password.", 401);
      }
      const workspaces = await this.repository.listWorkspaces(client, user.id);
      const activeWorkspaceId = workspaces[0]?.organizationId ?? null;
      const token = randomBytes(48).toString("base64url");
      await client.query("BEGIN");
      await this.repository.createSession(client, user.id, hashSessionToken(token), activeWorkspaceId);
      await this.repository.updateLastLogin(client, user.id);
      await client.query("COMMIT");
      return { user: publicUser(user), workspaces, activeWorkspaceId, token };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getSessionIdentity(token: string): Promise<SessionIdentity | null> {
    const client = await pool.connect();
    try {
      return await this.repository.findSessionIdentity(client, hashSessionToken(token));
    } finally {
      client.release();
    }
  }

  async getWorkspaces(userId: string): Promise<WorkspaceMembership[]> {
    const client = await pool.connect();
    try {
      return await this.repository.listWorkspaces(client, userId);
    } finally {
      client.release();
    }
  }

  async selectWorkspace(
    identity: Pick<AuthIdentity, "id" | "sessionId">,
    organizationId: string,
  ): Promise<WorkspaceMembership> {
    const client = await pool.connect();
    try {
      const workspace = await this.repository.findWorkspaceMembership(client, identity.id, organizationId);
      if (!workspace) throw new AppError("You do not have access to this workspace.", 404);
      await this.repository.updateActiveWorkspace(client, identity.sessionId, organizationId);
      return workspace;
    } finally {
      client.release();
    }
  }

  async resolveWorkspace(identity: AuthIdentity, organizationId: string): Promise<WorkspaceAuth | null> {
    const client = await pool.connect();
    try {
      const workspace = await this.repository.findWorkspaceMembership(client, identity.id, organizationId);
      if (!workspace) return null;
      return {
        ...identity,
        membershipId: workspace.membershipId,
        organizationId: workspace.organizationId,
        workspaceName: workspace.name,
        role: workspace.role,
        permissions: workspace.permissions,
      };
    } finally {
      client.release();
    }
  }

  async revoke(token: string): Promise<void> {
    const client = await pool.connect();
    try {
      await this.repository.revokeSession(client, hashSessionToken(token));
    } finally {
      client.release();
    }
  }

  toPublicUser(identity: SessionIdentity): PublicUser {
    return publicUser(identity);
  }
}
