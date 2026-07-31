import type { PoolClient } from "pg";
import { pool as dbPool } from "../server/config/database";
import { hashPassword } from "../server/auth/password";
import { rolePermissions } from "../server/auth/permissions";
import { runMigrations } from "./migration-runner";

export { dbPool };

/** A real UUID lets all foreign keys remain valid in PostgreSQL. */
export const DEFAULT_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";

const initialStages = [
  ["New Lead", 1, 0.10, "Inbound or outbound newly identified lead."],
  ["Contacted", 2, 0.20, "Initial discovery call or email exchange completed."],
  ["Qualified", 3, 0.40, "Budget and authority confirmed."],
  ["Proposal Sent", 4, 0.60, "Formal proposal submitted to the lead."],
  ["Negotiation", 5, 0.80, "Reviewing price, terms, and service level expectations."],
  ["Won", 6, 1.00, "Deal successfully closed."],
  ["Lost", 7, 0.00, "Lead lost or archived."],
] as const;

const initialUsers = [
  ["System", "Admin", "admin@mip-platform.com", "Admin"],
  ["Marketing", "Manager", "marketing@mip-platform.com", "Marketing Manager"],
  ["Sales", "Agent", "sales@mip-platform.com", "Sales Agent"],
] as const;

let initialized = false;

function configuredDemoPassword(): string {
  return process.env.DEV_DEMO_PASSWORD || "Pass2026!";
}

/**
 * Applies migrations and adds a small, known development team to an empty
 * database. It never overwrites an existing user's password.
 */
export async function initDatabase(): Promise<void> {
  if (initialized) return;
  await runMigrations();

  // Demo records make local development approachable, but must never create
  // shared accounts in a deployed product. Production users create their own
  // account and workspace through the onboarding flow.
  if (process.env.NODE_ENV === "production") {
    initialized = true;
    console.log("[PostgreSQL] MIP schema is ready.");
    return;
  }

  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO organizations (id, name, slug, industry, country, timezone, currency)
       VALUES ($1, 'MIP Demo Organization', 'mip-demo', 'Marketing', 'Kenya', 'Africa/Nairobi', 'KES')
       ON CONFLICT (id) DO NOTHING`,
      [DEFAULT_ORGANIZATION_ID],
    );

    for (const [name, permissions] of Object.entries(rolePermissions)) {
      await client.query(
        `INSERT INTO roles (organization_id, name, description, permissions)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (organization_id, name)
         DO UPDATE SET permissions = EXCLUDED.permissions, updated_at = CURRENT_TIMESTAMP`,
        [DEFAULT_ORGANIZATION_ID, name, `${name} access to the Marketing Intelligence Platform.`, permissions],
      );
    }

    for (const [name, order, probability, description] of initialStages) {
      await client.query(
        `INSERT INTO pipeline_stages (organization_id, name, stage_order, win_probability, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (organization_id, name)
         DO UPDATE SET stage_order = EXCLUDED.stage_order, win_probability = EXCLUDED.win_probability,
                       description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP`,
        [DEFAULT_ORGANIZATION_ID, name, order, probability, description],
      );
    }

    const passwordHash = await hashPassword(configuredDemoPassword());
    for (const [firstName, lastName, email, roleName] of initialUsers) {
      await client.query(
        `INSERT INTO users (organization_id, first_name, last_name, email, password_hash)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        [DEFAULT_ORGANIZATION_ID, firstName, lastName, email, passwordHash],
      );
      await client.query(
        `INSERT INTO organization_users (organization_id, user_id, role_id)
         SELECT $1, u.id, r.id FROM users u
         JOIN roles r ON r.organization_id = $1 AND r.name = $3
         WHERE u.email = $2
         ON CONFLICT (organization_id, user_id)
         DO UPDATE SET role_id = EXCLUDED.role_id, is_active = TRUE, updated_at = CURRENT_TIMESTAMP`,
        [DEFAULT_ORGANIZATION_ID, email, roleName],
      );
    }
    await client.query("COMMIT");
    initialized = true;
    console.log("[PostgreSQL] MIP schema is ready.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function dateOnly(value: Date | string | null): string {
  return value ? new Date(value).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function nameOf(firstName: string | null, lastName: string | null, fallback = "Unassigned"): string {
  return [firstName, lastName].filter(Boolean).join(" ") || fallback;
}

function score(value: unknown): number {
  const numberValue = Number(value ?? 0);
  return Math.min(100, Math.max(0, Number.isFinite(numberValue) ? Math.round(numberValue) : 0));
}

async function findStageId(client: PoolClient, organizationId: string, stageName?: string, stageId?: string): Promise<string> {
  const byId = stageId
    ? await client.query<{ id: string }>("SELECT id FROM pipeline_stages WHERE id = $1 AND organization_id = $2", [stageId, organizationId])
    : null;
  if (byId?.rows[0]) return byId.rows[0].id;
  const byName = stageName
    ? await client.query<{ id: string }>("SELECT id FROM pipeline_stages WHERE name = $1 AND organization_id = $2", [stageName, organizationId])
    : null;
  if (byName?.rows[0]) return byName.rows[0].id;
  const firstStage = await client.query<{ id: string }>(
    "SELECT id FROM pipeline_stages WHERE organization_id = $1 AND is_active = TRUE ORDER BY stage_order LIMIT 1",
    [organizationId],
  );
  if (!firstStage.rows[0]) throw new Error("No active pipeline stage is configured for this organization.");
  return firstStage.rows[0].id;
}

async function findAssigneeId(client: PoolClient, organizationId: string, assignee?: string, assigneeId?: string): Promise<string | null> {
  if (assigneeId) {
    const byId = await client.query<{ id: string }>(
      `SELECT u.id FROM users u JOIN organization_users ou ON ou.user_id = u.id
       WHERE u.id = $1 AND ou.organization_id = $2 AND ou.is_active = TRUE`, [assigneeId, organizationId],
    );
    if (byId.rows[0]) return byId.rows[0].id;
  }
  if (!assignee?.trim()) return null;
  const byName = await client.query<{ id: string }>(
    `SELECT u.id FROM users u JOIN organization_users ou ON ou.user_id = u.id
     WHERE ou.organization_id = $1 AND CONCAT_WS(' ', u.first_name, u.last_name) ILIKE $2
     LIMIT 1`, [organizationId, assignee.trim()],
  );
  return byName.rows[0]?.id ?? null;
}

export async function getPipelineStagesFromDb(organizationId: string) {
  const result = await dbPool.query(
    `SELECT id, organization_id, name, stage_order, win_probability, description
       FROM pipeline_stages WHERE organization_id = $1 AND is_active = TRUE ORDER BY stage_order`, [organizationId],
  );
  return result.rows.map((row) => ({
    id: row.id, organizationId: row.organization_id, name: row.name, stageOrder: Number(row.stage_order),
    winProbability: Number(row.win_probability), description: row.description ?? undefined,
  }));
}

export async function getLeadsFromDb(organizationId: string) {
  const result = await dbPool.query(
    `SELECT l.id, l.first_name, l.last_name, l.company_name, l.email, l.phone,
            l.estimated_value, l.source, l.lead_score, l.notes, l.created_at, l.updated_at,
            ps.name AS stage_name, a.first_name AS assignee_first_name, a.last_name AS assignee_last_name
       FROM leads l
       JOIN pipeline_stages ps ON ps.id = l.pipeline_stage_id
       LEFT JOIN users a ON a.id = l.assigned_user_id
      WHERE l.organization_id = $1 AND l.is_active = TRUE
      ORDER BY l.created_at DESC`, [organizationId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: nameOf(row.first_name, row.last_name, "Unnamed lead"),
    company: row.company_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    value: Number(row.estimated_value ?? 0),
    stage: row.stage_name,
    source: row.source ?? "",
    leadScore: score(row.lead_score),
    assignee: nameOf(row.assignee_first_name, row.assignee_last_name),
    dateCreated: dateOnly(row.created_at),
    lastUpdated: dateOnly(row.updated_at),
    notes: row.notes ?? "",
  }));
}

export async function createLeadInDb(lead: any, organizationId: string, actorId: string) {
  const name = String(lead.name ?? "").trim();
  const email = String(lead.email ?? "").trim().toLowerCase();
  if (!name || !email) throw new Error("Name and email are required.");
  const [firstName, ...lastNameParts] = name.split(/\s+/);
  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    const stageId = await findStageId(client, organizationId, lead.stage, lead.pipelineStageId);
    const assigneeId = await findAssigneeId(client, organizationId, lead.assignee, lead.assignedUserId);
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO leads (organization_id, pipeline_stage_id, assigned_user_id, campaign_id, first_name, last_name,
                          company_name, email, phone, source, estimated_value, lead_score, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [organizationId, stageId, assigneeId, lead.campaignId ?? null, firstName, lastNameParts.join(" ") || null,
       lead.company ?? null, email, lead.phone ?? null, lead.source ?? null, Number(lead.value ?? 0), score(lead.leadScore), lead.notes ?? null],
    );
    await client.query(
      `INSERT INTO lead_stage_history (organization_id, lead_id, pipeline_stage_id, changed_by_user_id, notes)
       VALUES ($1,$2,$3,$4,'Lead created')`, [organizationId, inserted.rows[0].id, stageId, actorId],
    );
    await client.query("COMMIT");
    return inserted.rows[0].id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateLeadInDb(leadId: string, update: any, organizationId: string, actorId: string): Promise<boolean> {
  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{ pipeline_stage_id: string }>(
      "SELECT pipeline_stage_id FROM leads WHERE id = $1 AND organization_id = $2 AND is_active = TRUE", [leadId, organizationId],
    );
    if (!existing.rows[0]) { await client.query("ROLLBACK"); return false; }
    const name = typeof update.name === "string" ? update.name.trim() : undefined;
    const [firstName, ...lastNameParts] = name ? name.split(/\s+/) : [];
    const stageId = update.stage || update.pipelineStageId
      ? await findStageId(client, organizationId, update.stage, update.pipelineStageId) : existing.rows[0].pipeline_stage_id;
    const assigneeId = update.assignee || update.assignedUserId
      ? await findAssigneeId(client, organizationId, update.assignee, update.assignedUserId) : undefined;
    const result = await client.query(
      `UPDATE leads SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
              company_name = COALESCE($3, company_name), email = COALESCE($4, email), phone = COALESCE($5, phone),
              estimated_value = COALESCE($6, estimated_value), source = COALESCE($7, source),
              lead_score = COALESCE($8, lead_score), notes = COALESCE($9, notes), campaign_id = COALESCE($10, campaign_id),
              assigned_user_id = COALESCE($11, assigned_user_id), pipeline_stage_id = $12, updated_at = CURRENT_TIMESTAMP
        WHERE id = $13 AND organization_id = $14`,
      [firstName ?? null, name ? lastNameParts.join(" ") || null : null, update.company ?? null,
       typeof update.email === "string" ? update.email.trim().toLowerCase() : null, update.phone ?? null,
       update.value === undefined ? null : Number(update.value), update.source ?? null,
       update.leadScore === undefined ? null : score(update.leadScore), update.notes ?? null, update.campaignId ?? null,
       assigneeId, stageId, leadId, organizationId],
    );
    if (stageId !== existing.rows[0].pipeline_stage_id) {
      await recordStageChange(client, organizationId, leadId, existing.rows[0].pipeline_stage_id, stageId, actorId, "Lead details updated");
    }
    await client.query("COMMIT");
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

async function recordStageChange(client: PoolClient, organizationId: string, leadId: string, fromStageId: string, toStageId: string, actorId: string, notes: string): Promise<void> {
  await client.query(
    "UPDATE lead_stage_history SET exited_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE lead_id = $1 AND exited_at IS NULL", [leadId],
  );
  await client.query(
    `INSERT INTO lead_stage_history (organization_id, lead_id, pipeline_stage_id, changed_by_user_id, notes)
     VALUES ($1,$2,$3,$4,$5)`, [organizationId, leadId, toStageId, actorId, notes],
  );
}

export async function updateLeadStageInDb(leadId: string, stageName: string, organizationId: string, actorId: string): Promise<boolean> {
  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query<{ pipeline_stage_id: string }>(
      "SELECT pipeline_stage_id FROM leads WHERE id = $1 AND organization_id = $2 AND is_active = TRUE", [leadId, organizationId],
    );
    if (!current.rows[0]) { await client.query("ROLLBACK"); return false; }
    const nextStageId = await findStageId(client, organizationId, stageName);
    if (nextStageId !== current.rows[0].pipeline_stage_id) {
      await client.query("UPDATE leads SET pipeline_stage_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [nextStageId, leadId]);
      await recordStageChange(client, organizationId, leadId, current.rows[0].pipeline_stage_id, nextStageId, actorId, `Stage changed to ${stageName}`);
    }
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export async function deleteLeadFromDb(leadId: string, organizationId: string): Promise<boolean> {
  const result = await dbPool.query(
    "UPDATE leads SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND organization_id = $2 AND is_active = TRUE", [leadId, organizationId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function clearAllDataFromDb(organizationId: string): Promise<void> {
  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM notifications WHERE organization_id = $1", [organizationId]);
    await client.query("DELETE FROM followups WHERE organization_id = $1", [organizationId]);
    await client.query("DELETE FROM activities WHERE organization_id = $1", [organizationId]);
    await client.query("DELETE FROM lead_stage_history WHERE organization_id = $1", [organizationId]);
    await client.query("DELETE FROM leads WHERE organization_id = $1", [organizationId]);
    await client.query("DELETE FROM campaigns WHERE organization_id = $1", [organizationId]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function getCampaignsFromDb(organizationId: string) {
  const result = await dbPool.query(
    `SELECT id, name, description, budget, spent, leads_count, conversions, status, clicks, impressions, start_date
       FROM campaigns WHERE organization_id = $1 AND is_active = TRUE ORDER BY created_at DESC`, [organizationId],
  );
  return result.rows.map((row) => ({
    id: row.id, name: row.name, description: row.description ?? "", budget: Number(row.budget ?? 0),
    spent: Number(row.spent ?? 0), leadsCount: Number(row.leads_count ?? 0), conversions: Number(row.conversions ?? 0),
    status: row.status ?? "Planned", clicks: Number(row.clicks ?? 0), impressions: Number(row.impressions ?? 0),
    dateStarted: dateOnly(row.start_date),
  }));
}

export async function createCampaignInDb(campaign: any, organizationId: string) {
  await dbPool.query(
    `INSERT INTO campaigns (organization_id, name, description, campaign_type, channel, start_date, budget, spent,
                            leads_count, conversions, status, clicks, impressions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [organizationId, String(campaign.name).trim(), campaign.description ?? null, campaign.campaignType ?? null,
     campaign.channel ?? null, campaign.dateStarted ?? new Date().toISOString().slice(0, 10), Number(campaign.budget ?? 0),
     Number(campaign.spent ?? 0), Number(campaign.leadsCount ?? 0), Number(campaign.conversions ?? 0),
     campaign.status ?? "Planned", Number(campaign.clicks ?? 0), Number(campaign.impressions ?? 0)],
  );
}

export async function getActivitiesFromDb(organizationId: string) {
  const result = await dbPool.query(
    `SELECT a.id, a.activity_type, a.description, a.activity_date, l.first_name AS lead_first_name, l.last_name AS lead_last_name,
            l.id AS lead_id, u.first_name AS user_first_name, u.last_name AS user_last_name
       FROM activities a JOIN leads l ON l.id = a.lead_id JOIN users u ON u.id = a.user_id
      WHERE a.organization_id = $1 ORDER BY a.activity_date DESC`, [organizationId],
  );
  return result.rows.map((row) => ({
    id: row.id, type: row.activity_type, leadId: row.lead_id, leadName: nameOf(row.lead_first_name, row.lead_last_name),
    description: row.description ?? "", performer: nameOf(row.user_first_name, row.user_last_name, "System"),
    timestamp: new Date(row.activity_date).toISOString(),
  }));
}

export async function createActivityInDb(activity: { leadId: string; type?: string; description?: string }, organizationId: string, actorId: string): Promise<void> {
  await dbPool.query(
    `INSERT INTO activities (organization_id, lead_id, user_id, activity_type, description)
     SELECT $1, l.id, $3, $4, $5 FROM leads l WHERE l.id = $2 AND l.organization_id = $1 AND l.is_active = TRUE`,
    [organizationId, activity.leadId, actorId, activity.type ?? "Note", activity.description ?? ""],
  );
}

export async function getFollowUpsFromDb(organizationId: string) {
  const result = await dbPool.query(
    `SELECT f.id, f.lead_id, f.followup_type, f.due_date, f.description, f.priority, f.status,
            l.first_name, l.last_name
       FROM followups f JOIN leads l ON l.id = f.lead_id
      WHERE f.organization_id = $1 ORDER BY f.due_date ASC`, [organizationId],
  );
  return result.rows.map((row) => ({
    id: row.id, leadId: row.lead_id, leadName: nameOf(row.first_name, row.last_name), type: row.followup_type,
    scheduledTime: new Date(row.due_date).toISOString(), notes: row.description ?? "", priority: row.priority,
    status: row.status,
  }));
}

export async function createFollowUpInDb(followup: any, organizationId: string, actorId: string): Promise<void> {
  await dbPool.query(
    `INSERT INTO followups (organization_id, lead_id, assigned_user_id, title, description, due_date, status, followup_type, priority)
     SELECT $1, l.id, $3, $4, $5, $6, 'Pending', $7, $8 FROM leads l
      WHERE l.id = $2 AND l.organization_id = $1 AND l.is_active = TRUE`,
    [organizationId, followup.leadId, actorId, `${followup.type ?? "Call"} follow-up`, followup.notes ?? "",
     followup.scheduledTime, followup.type ?? "Call", followup.priority ?? "Medium"],
  );
}

export async function getNotificationsFromDb(organizationId: string) {
  const result = await dbPool.query(
    "SELECT id, title, message, type, is_read, created_at FROM notifications WHERE organization_id = $1 ORDER BY created_at DESC", [organizationId],
  );
  return result.rows.map((row) => ({
    id: row.id, title: row.title, message: row.message, type: row.type, isRead: row.is_read,
    time: new Date(row.created_at).toISOString(),
  }));
}

export async function createNotificationInDb(notification: any, organizationId: string): Promise<void> {
  await dbPool.query(
    "INSERT INTO notifications (organization_id, title, message, type) VALUES ($1,$2,$3,$4)",
    [organizationId, notification.title, notification.message, notification.type ?? "info"],
  );
}
