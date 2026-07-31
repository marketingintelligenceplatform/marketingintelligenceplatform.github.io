import type { PoolClient } from "pg";
import type { WorkspaceMembership } from "../identity/identity.repository";

export interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  country: string | null;
  timezone: string | null;
  currency: string | null;
  logo_url: string | null;
  onboarding_completed_at: Date | null;
}

export interface InvitationRecord {
  id: string;
  organization_id: string;
  email: string;
  role_id: string;
  role_name: string;
  token_hash: string;
  expires_at: Date;
  accepted_at: Date | null;
  revoked_at: Date | null;
  organization_name: string;
}

export class WorkspaceRepository {
  async findOrganizationBySlug(client: PoolClient, slug: string): Promise<WorkspaceRecord | null> {
    const result = await client.query<WorkspaceRecord>(
      `SELECT id, name, slug, industry, country, timezone, currency, logo_url, onboarding_completed_at
         FROM organizations WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    return result.rows[0] ?? null;
  }

  async createOrganization(client: PoolClient, input: {
    name: string; slug: string; industry: string | null; country: string | null;
    timezone: string | null; currency: string | null; logoUrl: string | null;
  }): Promise<WorkspaceRecord> {
    const result = await client.query<WorkspaceRecord>(
      `INSERT INTO organizations (name, slug, industry, country, timezone, currency, logo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, slug, industry, country, timezone, currency, logo_url, onboarding_completed_at`,
      [input.name, input.slug, input.industry, input.country, input.timezone, input.currency, input.logoUrl],
    );
    return result.rows[0];
  }

  async updateOrganization(client: PoolClient, organizationId: string, input: Partial<{
    name: string; industry: string | null; country: string | null; timezone: string | null; currency: string | null; logoUrl: string | null;
  }>): Promise<WorkspaceRecord | null> {
    const result = await client.query<WorkspaceRecord>(
      `UPDATE organizations
          SET name = COALESCE($1, name), industry = COALESCE($2, industry), country = COALESCE($3, country),
              timezone = COALESCE($4, timezone), currency = COALESCE($5, currency), logo_url = COALESCE($6, logo_url),
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $7 AND is_active = TRUE
      RETURNING id, name, slug, industry, country, timezone, currency, logo_url, onboarding_completed_at`,
      [input.name ?? null, input.industry ?? null, input.country ?? null, input.timezone ?? null, input.currency ?? null, input.logoUrl ?? null, organizationId],
    );
    return result.rows[0] ?? null;
  }

  async findRole(client: PoolClient, organizationId: string, roleName: string): Promise<{ id: string; name: string; permissions: string[] } | null> {
    const result = await client.query<{ id: string; name: string; permissions: string[] }>(
      "SELECT id, name, permissions FROM roles WHERE organization_id = $1 AND name = $2 LIMIT 1",
      [organizationId, roleName],
    );
    return result.rows[0] ?? null;
  }

  async createOrActivateMembership(client: PoolClient, organizationId: string, userId: string, roleId: string): Promise<string> {
    const result = await client.query<{ id: string }>(
      `INSERT INTO organization_users (organization_id, user_id, role_id, is_active, status, activated_at)
       VALUES ($1, $2, $3, TRUE, 'active', CURRENT_TIMESTAMP)
       ON CONFLICT (organization_id, user_id)
       DO UPDATE SET role_id = EXCLUDED.role_id, is_active = TRUE, status = 'active',
                     activated_at = COALESCE(organization_users.activated_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [organizationId, userId, roleId],
    );
    return result.rows[0].id;
  }

  async createWelcomeNotification(client: PoolClient, organizationId: string, workspaceName: string): Promise<void> {
    await client.query(
      `INSERT INTO notifications (organization_id, title, message, type)
       VALUES ($1, 'Welcome to MIP', $2, 'success')`,
      [organizationId, `${workspaceName} is ready. Invite your team or add a first lead to begin.`],
    );
  }

  async createSampleData(client: PoolClient, organizationId: string, userId: string): Promise<void> {
    const stage = await client.query<{ id: string }>(
      `SELECT id FROM pipeline_stages WHERE organization_id = $1 AND name = 'New Lead' LIMIT 1`,
      [organizationId],
    );
    if (!stage.rows[0]) return;
    const campaign = await client.query<{ id: string }>(
      `INSERT INTO campaigns (organization_id, name, description, campaign_type, channel, start_date, budget, status)
       VALUES ($1, 'Welcome Campaign', 'A sample campaign to show how MIP connects marketing activity to pipeline.', 'Awareness', 'LinkedIn', CURRENT_DATE, 25000, 'Planned')
       RETURNING id`,
      [organizationId],
    );
    await client.query(
      `INSERT INTO leads (organization_id, pipeline_stage_id, assigned_user_id, campaign_id, first_name, last_name,
                          company_name, email, source, estimated_value, lead_score, notes)
       VALUES ($1, $2, $3, $4, 'Amina', 'Njoroge', 'Example Growth Co.', 'amina@example.test',
               'Website Referral', 180000, 72, 'Sample lead — archive or update it when your team is ready.')`,
      [organizationId, stage.rows[0].id, userId, campaign.rows[0].id],
    );
  }

  async addAuditEvent(client: PoolClient, input: { organizationId: string | null; membershipId: string | null; eventType: string; entityType?: string; entityId?: string; metadata?: Record<string, unknown> }): Promise<void> {
    await client.query(
      `INSERT INTO audit_events (organization_id, membership_id, event_type, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [input.organizationId, input.membershipId, input.eventType, input.entityType ?? null, input.entityId ?? null, JSON.stringify(input.metadata ?? {})],
    );
  }

  async addOutboxEvent(client: PoolClient, input: { organizationId: string; eventType: string; aggregateType: string; aggregateId: string; payload: Record<string, unknown> }): Promise<void> {
    await client.query(
      `INSERT INTO outbox_events (organization_id, event_type, aggregate_type, aggregate_id, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [input.organizationId, input.eventType, input.aggregateType, input.aggregateId, JSON.stringify(input.payload)],
    );
  }

  async listMembers(client: PoolClient, organizationId: string): Promise<Array<{
    membershipId: string; userId: string; name: string; email: string; role: string; status: string; joinedAt: Date | null;
  }>> {
    const result = await client.query<{
      membership_id: string; user_id: string; first_name: string; last_name: string | null; email: string;
      role: string; status: string; joined_at: Date | null;
    }>(
      `SELECT ou.id AS membership_id, u.id AS user_id, u.first_name, u.last_name, u.email,
              r.name AS role, ou.status, ou.joined_at
         FROM organization_users ou
         JOIN users u ON u.id = ou.user_id
         JOIN roles r ON r.id = ou.role_id
        WHERE ou.organization_id = $1 AND ou.status <> 'left'
        ORDER BY u.first_name, u.last_name`,
      [organizationId],
    );
    return result.rows.map((row) => ({
      membershipId: row.membership_id,
      userId: row.user_id,
      name: [row.first_name, row.last_name].filter(Boolean).join(" "),
      email: row.email,
      role: row.role,
      status: row.status,
      joinedAt: row.joined_at,
    }));
  }

  async createInvitation(client: PoolClient, input: {
    organizationId: string; email: string; roleId: string; invitedByMembershipId: string; tokenHash: string;
  }): Promise<{ id: string; expiresAt: Date }> {
    const result = await client.query<{ id: string; expires_at: Date }>(
      `INSERT INTO workspace_invitations (organization_id, email, role_id, invited_by_membership_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP + INTERVAL '7 days')
       RETURNING id, expires_at`,
      [input.organizationId, input.email, input.roleId, input.invitedByMembershipId, input.tokenHash],
    );
    return { id: result.rows[0].id, expiresAt: result.rows[0].expires_at };
  }

  async findInvitationForAcceptance(client: PoolClient, tokenHash: string): Promise<InvitationRecord | null> {
    const result = await client.query<InvitationRecord>(
      `SELECT wi.id, wi.organization_id, wi.email, wi.role_id, r.name AS role_name, wi.token_hash,
              wi.expires_at, wi.accepted_at, wi.revoked_at, o.name AS organization_name
         FROM workspace_invitations wi
         JOIN organizations o ON o.id = wi.organization_id AND o.is_active = TRUE
         JOIN roles r ON r.id = wi.role_id
        WHERE wi.token_hash = $1
        FOR UPDATE`,
      [tokenHash],
    );
    return result.rows[0] ?? null;
  }

  async acceptInvitation(client: PoolClient, invitationId: string): Promise<void> {
    await client.query(
      `UPDATE workspace_invitations SET accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [invitationId],
    );
  }

  async getWorkspaceMembership(client: PoolClient, userId: string, organizationId: string): Promise<WorkspaceMembership | null> {
    const result = await client.query<{
      membership_id: string; organization_id: string; name: string; slug: string; logo_url: string | null;
      role: string; permissions: string[];
    }>(
      `SELECT ou.id AS membership_id, o.id AS organization_id, o.name, o.slug, o.logo_url,
              r.name AS role, r.permissions
         FROM organization_users ou
         JOIN organizations o ON o.id = ou.organization_id
         JOIN roles r ON r.id = ou.role_id
        WHERE ou.user_id = $1 AND ou.organization_id = $2
          AND ou.is_active = TRUE AND ou.status = 'active'`,
      [userId, organizationId],
    );
    const row = result.rows[0];
    return row ? {
      membershipId: row.membership_id, organizationId: row.organization_id, name: row.name, slug: row.slug,
      logoUrl: row.logo_url, role: row.role, permissions: row.permissions ?? [],
    } : null;
  }
}
