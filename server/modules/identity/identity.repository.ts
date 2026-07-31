import type { PoolClient } from "pg";

export interface UserRecord {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  password_hash: string;
  is_active: boolean;
}

export interface WorkspaceMembership {
  membershipId: string;
  organizationId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: string;
  permissions: string[];
}

export interface SessionIdentity extends Omit<UserRecord, "password_hash"> {
  sessionId: string;
  activeOrganizationId: string | null;
}

export class IdentityRepository {
  async findUserByEmail(client: PoolClient, email: string): Promise<UserRecord | null> {
    const result = await client.query<UserRecord>(
      `SELECT id, first_name, last_name, email, password_hash, is_active
         FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    return result.rows[0] ?? null;
  }

  async createUser(client: PoolClient, input: { firstName: string; lastName: string | null; email: string; passwordHash: string }): Promise<UserRecord> {
    const result = await client.query<UserRecord>(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, first_name, last_name, email, password_hash, is_active`,
      [input.firstName, input.lastName, input.email, input.passwordHash],
    );
    return result.rows[0];
  }

  async listWorkspaces(client: PoolClient, userId: string): Promise<WorkspaceMembership[]> {
    const result = await client.query<{
      membership_id: string; organization_id: string; name: string; slug: string; logo_url: string | null;
      role: string; permissions: string[];
    }>(
      `SELECT ou.id AS membership_id, o.id AS organization_id, o.name, o.slug, o.logo_url,
              r.name AS role, r.permissions
         FROM organization_users ou
         JOIN organizations o ON o.id = ou.organization_id AND o.is_active = TRUE
         JOIN roles r ON r.id = ou.role_id
        WHERE ou.user_id = $1 AND ou.is_active = TRUE AND ou.status = 'active'
        ORDER BY o.name ASC`,
      [userId],
    );
    return result.rows.map((row) => ({
      membershipId: row.membership_id,
      organizationId: row.organization_id,
      name: row.name,
      slug: row.slug,
      logoUrl: row.logo_url,
      role: row.role,
      permissions: row.permissions ?? [],
    }));
  }

  async findWorkspaceMembership(client: PoolClient, userId: string, organizationId: string): Promise<WorkspaceMembership | null> {
    const workspaces = await client.query<{
      membership_id: string; organization_id: string; name: string; slug: string; logo_url: string | null;
      role: string; permissions: string[];
    }>(
      `SELECT ou.id AS membership_id, o.id AS organization_id, o.name, o.slug, o.logo_url,
              r.name AS role, r.permissions
         FROM organization_users ou
         JOIN organizations o ON o.id = ou.organization_id AND o.is_active = TRUE
         JOIN roles r ON r.id = ou.role_id
        WHERE ou.user_id = $1 AND ou.organization_id = $2
          AND ou.is_active = TRUE AND ou.status = 'active'
        LIMIT 1`,
      [userId, organizationId],
    );
    const row = workspaces.rows[0];
    return row ? {
      membershipId: row.membership_id,
      organizationId: row.organization_id,
      name: row.name,
      slug: row.slug,
      logoUrl: row.logo_url,
      role: row.role,
      permissions: row.permissions ?? [],
    } : null;
  }

  async createSession(client: PoolClient, userId: string, tokenHash: string, activeOrganizationId: string | null): Promise<string> {
    const result = await client.query<{ id: string }>(
      `INSERT INTO sessions (user_id, active_organization_id, token_hash, expires_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '7 days') RETURNING id`,
      [userId, activeOrganizationId, tokenHash],
    );
    return result.rows[0].id;
  }

  async updateActiveWorkspace(client: PoolClient, sessionId: string, organizationId: string): Promise<void> {
    await client.query(
      `UPDATE sessions SET active_organization_id = $1, last_seen_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND revoked_at IS NULL`,
      [organizationId, sessionId],
    );
  }

  async revokeSession(client: PoolClient, tokenHash: string): Promise<void> {
    await client.query(
      "UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1 AND revoked_at IS NULL",
      [tokenHash],
    );
  }

  async findSessionIdentity(client: PoolClient, tokenHash: string): Promise<SessionIdentity | null> {
    const result = await client.query<{
      id: string; first_name: string; last_name: string | null; email: string; is_active: boolean;
      session_id: string; active_organization_id: string | null;
    }>(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.is_active,
              s.id AS session_id, s.active_organization_id
         FROM sessions s
         JOIN users u ON u.id = s.user_id AND u.is_active = TRUE
        WHERE s.token_hash = $1 AND s.expires_at > CURRENT_TIMESTAMP AND s.revoked_at IS NULL
        LIMIT 1`,
      [tokenHash],
    );
    const row = result.rows[0];
    return row ? {
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      is_active: row.is_active,
      sessionId: row.session_id,
      activeOrganizationId: row.active_organization_id,
    } : null;
  }

  async updateLastLogin(client: PoolClient, userId: string): Promise<void> {
    await client.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1", [userId]);
  }
}
