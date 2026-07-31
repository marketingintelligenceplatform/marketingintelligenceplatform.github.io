import { randomBytes } from "node:crypto";
import { pool } from "../../config/database";
import { hashPassword } from "../../auth/password";
import { hashSessionToken } from "../../auth/token";
import type { AuthIdentity, WorkspaceAuth } from "../../auth/types";
import { AppError } from "../../shared/errors";
import { email, optionalBoolean, optionalText, password, requiredText, workspaceSlug } from "../../shared/validation";
import { IdentityRepository, type UserRecord } from "../identity/identity.repository";
import { seedWorkspaceDefaults } from "./workspace.defaults";
import { WorkspaceRepository, type WorkspaceRecord } from "./workspace.repository";

function publicUser(user: Pick<UserRecord, "id" | "first_name" | "last_name" | "email">) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return {
    id: user.id,
    name,
    email: user.email,
    avatar: name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
  };
}

function publicWorkspace(record: WorkspaceRecord) {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    industry: record.industry,
    country: record.country,
    timezone: record.timezone,
    currency: record.currency,
    logoUrl: record.logo_url,
    onboardingCompletedAt: record.onboarding_completed_at,
  };
}

export class WorkspaceService {
  constructor(
    private readonly repository = new WorkspaceRepository(),
    private readonly identities = new IdentityRepository(),
  ) {}

  async createWorkspace(identity: AuthIdentity, input: Record<string, unknown>) {
    const name = requiredText(input.name, "Workspace name", 255);
    const industry = optionalText(input.industry, "Industry", 100);
    const country = optionalText(input.country, "Country", 100);
    const timezone = optionalText(input.timezone, "Timezone", 100) ?? "Africa/Nairobi";
    const currency = optionalText(input.currency, "Currency", 20) ?? "KES";
    const logoUrl = optionalText(input.logoUrl, "Logo URL", 2048);
    const includeSampleData = optionalBoolean(input.includeSampleData, true);
    const baseSlug = workspaceSlug(name);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let slug = baseSlug;
      let suffix = 2;
      while (await this.repository.findOrganizationBySlug(client, slug)) {
        slug = `${baseSlug}-${suffix++}`;
      }
      const workspace = await this.repository.createOrganization(client, {
        name, slug, industry, country, timezone, currency, logoUrl,
      });
      await seedWorkspaceDefaults(client, workspace.id);
      const ownerRole = await this.repository.findRole(client, workspace.id, "Admin");
      if (!ownerRole) throw new AppError("Workspace default roles could not be created.", 500);
      const membershipId = await this.repository.createOrActivateMembership(client, workspace.id, identity.id, ownerRole.id);
      await this.identities.updateActiveWorkspace(client, identity.sessionId, workspace.id);
      await this.repository.createWelcomeNotification(client, workspace.id, workspace.name);
      if (includeSampleData) await this.repository.createSampleData(client, workspace.id, identity.id);
      await this.repository.addAuditEvent(client, {
        organizationId: workspace.id,
        membershipId,
        eventType: "workspace.created",
        entityType: "workspace",
        entityId: workspace.id,
        metadata: { includeSampleData },
      });
      await client.query("COMMIT");
      return {
        workspace: publicWorkspace(workspace),
        membership: {
          membershipId,
          organizationId: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          logoUrl: workspace.logo_url,
          role: ownerRole.name,
          permissions: ownerRole.permissions ?? [],
        },
      };
    } catch (error: any) {
      await client.query("ROLLBACK");
      if (error?.code === "23505") throw new AppError("A workspace with this address already exists. Try another name.", 409);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateWorkspace(auth: WorkspaceAuth, input: Record<string, unknown>) {
    const client = await pool.connect();
    try {
      const workspace = await this.repository.updateOrganization(client, auth.organizationId, {
        name: input.name === undefined ? undefined : requiredText(input.name, "Workspace name", 255),
        industry: input.industry === undefined ? undefined : optionalText(input.industry, "Industry", 100),
        country: input.country === undefined ? undefined : optionalText(input.country, "Country", 100),
        timezone: input.timezone === undefined ? undefined : optionalText(input.timezone, "Timezone", 100),
        currency: input.currency === undefined ? undefined : optionalText(input.currency, "Currency", 20),
        logoUrl: input.logoUrl === undefined ? undefined : optionalText(input.logoUrl, "Logo URL", 2048),
      });
      if (!workspace) throw new AppError("Workspace not found.", 404);
      await this.repository.addAuditEvent(client, {
        organizationId: auth.organizationId,
        membershipId: auth.membershipId,
        eventType: "workspace.updated",
        entityType: "workspace",
        entityId: auth.organizationId,
      });
      return publicWorkspace(workspace);
    } finally {
      client.release();
    }
  }

  async listMembers(auth: WorkspaceAuth) {
    const client = await pool.connect();
    try {
      return await this.repository.listMembers(client, auth.organizationId);
    } finally {
      client.release();
    }
  }

  async invite(auth: WorkspaceAuth, input: Record<string, unknown>) {
    const invitedEmail = email(input.email);
    const roleName = requiredText(input.role, "Role", 100);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const role = await this.repository.findRole(client, auth.organizationId, roleName);
      if (!role) throw new AppError("Choose a role that belongs to this workspace.", 400);
      const token = randomBytes(32).toString("base64url");
      const invitation = await this.repository.createInvitation(client, {
        organizationId: auth.organizationId,
        email: invitedEmail,
        roleId: role.id,
        invitedByMembershipId: auth.membershipId,
        tokenHash: hashSessionToken(token),
      });
      const appUrl = process.env.APP_URL?.replace(/\/$/, "");
      const inviteUrl = appUrl ? `${appUrl}/?invite=${encodeURIComponent(token)}` : null;
      await this.repository.addOutboxEvent(client, {
        organizationId: auth.organizationId,
        eventType: "workspace.invitation.created",
        aggregateType: "workspace_invitation",
        aggregateId: invitation.id,
        payload: { email: invitedEmail, role: role.name, inviteUrl },
      });
      await this.repository.addAuditEvent(client, {
        organizationId: auth.organizationId,
        membershipId: auth.membershipId,
        eventType: "workspace.invitation.created",
        entityType: "workspace_invitation",
        entityId: invitation.id,
        metadata: { email: invitedEmail, role: role.name },
      });
      await client.query("COMMIT");
      return {
        id: invitation.id,
        email: invitedEmail,
        role: role.name,
        expiresAt: invitation.expiresAt,
        // An email worker receives the outbox event in production. The URL is
        // exposed only for local development so the complete flow is testable.
        inviteUrl: process.env.NODE_ENV === "production" ? null : inviteUrl,
      };
    } catch (error: any) {
      await client.query("ROLLBACK");
      if (error?.code === "23505") throw new AppError("This email already has an active invitation.", 409);
      throw error;
    } finally {
      client.release();
    }
  }

  async acceptInvitation(input: Record<string, unknown>, authenticatedIdentity?: AuthIdentity) {
    const rawToken = requiredText(input.token, "Invitation token", 512);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const invitation = await this.repository.findInvitationForAcceptance(client, hashSessionToken(rawToken));
      if (!invitation || invitation.revoked_at || invitation.accepted_at || invitation.expires_at <= new Date()) {
        throw new AppError("This invitation is invalid, expired, or has already been used.", 404);
      }

      let user = await this.identities.findUserByEmail(client, invitation.email);
      let token: string | null = null;
      let sessionId = authenticatedIdentity?.sessionId ?? null;
      if (user) {
        if (!authenticatedIdentity || authenticatedIdentity.id !== user.id) {
          throw new AppError("This email already has an account. Sign in before accepting the invitation.", 409);
        }
      } else {
        user = await this.identities.createUser(client, {
          firstName: requiredText(input.firstName, "First name", 100),
          lastName: optionalText(input.lastName, "Last name", 100),
          email: invitation.email,
          passwordHash: await hashPassword(password(input.password)),
        });
        token = randomBytes(48).toString("base64url");
        sessionId = await this.identities.createSession(client, user.id, hashSessionToken(token), invitation.organization_id);
      }

      const membershipId = await this.repository.createOrActivateMembership(client, invitation.organization_id, user.id, invitation.role_id);
      await this.repository.acceptInvitation(client, invitation.id);
      if (sessionId) await this.identities.updateActiveWorkspace(client, sessionId, invitation.organization_id);
      await this.repository.addAuditEvent(client, {
        organizationId: invitation.organization_id,
        membershipId,
        eventType: "workspace.invitation.accepted",
        entityType: "workspace_invitation",
        entityId: invitation.id,
      });
      await this.repository.addOutboxEvent(client, {
        organizationId: invitation.organization_id,
        eventType: "workspace.member.joined",
        aggregateType: "membership",
        aggregateId: membershipId,
        payload: { email: user.email, role: invitation.role_name },
      });
      await client.query("COMMIT");
      const workspace = await this.repository.getWorkspaceMembership(client, user.id, invitation.organization_id);
      return { user: publicUser(user), workspace, token };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
