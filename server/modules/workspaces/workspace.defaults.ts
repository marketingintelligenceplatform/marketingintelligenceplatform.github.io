import type { PoolClient } from "pg";
import { rolePermissions } from "../../auth/permissions";

export const DEFAULT_PIPELINE_STAGES = [
  ["New Lead", 1, 0.10, "Inbound or outbound newly identified lead."],
  ["Contacted", 2, 0.20, "Initial discovery call or email exchange completed."],
  ["Qualified", 3, 0.40, "Budget and authority confirmed."],
  ["Proposal Sent", 4, 0.60, "Formal proposal submitted to the lead."],
  ["Negotiation", 5, 0.80, "Reviewing price, terms, and service level expectations."],
  ["Won", 6, 1.00, "Deal successfully closed."],
  ["Lost", 7, 0.00, "Lead lost or archived."],
] as const;

/** Seeds the defaults every new workspace needs before it can be used. */
export async function seedWorkspaceDefaults(client: PoolClient, organizationId: string): Promise<void> {
  for (const [name, permissions] of Object.entries(rolePermissions)) {
    await client.query(
      `INSERT INTO roles (organization_id, name, description, permissions)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_id, name)
       DO UPDATE SET permissions = EXCLUDED.permissions, updated_at = CURRENT_TIMESTAMP`,
      [organizationId, name, `${name} access to the Marketing Intelligence Platform.`, permissions],
    );
  }

  for (const [name, order, probability, description] of DEFAULT_PIPELINE_STAGES) {
    await client.query(
      `INSERT INTO pipeline_stages (organization_id, name, stage_order, win_probability, description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (organization_id, name)
       DO UPDATE SET stage_order = EXCLUDED.stage_order, win_probability = EXCLUDED.win_probability,
                     description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP`,
      [organizationId, name, order, probability, description],
    );
  }
}
