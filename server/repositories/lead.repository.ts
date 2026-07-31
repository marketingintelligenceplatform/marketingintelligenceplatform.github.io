import { pool } from "../config/database";
import type { LeadListItem } from "../types/lead";

interface LeadRow {
  id: string;
  first_name: string;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  estimated_value: string | null;
  stage_name: string;
  source: string | null;
  assignee_first_name: string | null;
  assignee_last_name: string | null;
  created_at: Date;
  updated_at: Date;
  notes: string | null;
}

function formatName(firstName: string | null, lastName: string | null, fallback: string): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || fallback;
}

function toLeadListItem(row: LeadRow): LeadListItem {
  return {
    id: row.id,
    name: formatName(row.first_name, row.last_name, "Unnamed lead"),
    company: row.company_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    value: Number(row.estimated_value ?? 0),
    stage: row.stage_name,
    source: row.source ?? "",
    leadScore: null,
    assignee: formatName(row.assignee_first_name, row.assignee_last_name, "Unassigned"),
    dateCreated: row.created_at.toISOString().slice(0, 10),
    lastUpdated: row.updated_at.toISOString().slice(0, 10),
    notes: row.notes ?? "",
  };
}

/**
 * Data access boundary for leads. SQL and database-to-API mapping stay here
 * so services never need to know PostgreSQL column names.
 */
export class LeadRepository {
  async findByOrganizationId(organizationId: string): Promise<LeadListItem[]> {
    const result = await pool.query<LeadRow>(
      `SELECT
        leads.id,
        leads.first_name,
        leads.last_name,
        leads.company_name,
        leads.email,
        leads.phone,
        leads.estimated_value,
        pipeline_stages.name AS stage_name,
        leads.source,
        assignee.first_name AS assignee_first_name,
        assignee.last_name AS assignee_last_name,
        leads.created_at,
        leads.updated_at,
        leads.notes
      FROM leads
      INNER JOIN pipeline_stages ON pipeline_stages.id = leads.pipeline_stage_id
      LEFT JOIN users AS assignee ON assignee.id = leads.assigned_user_id
      WHERE leads.organization_id = $1
      ORDER BY leads.created_at DESC`,
      [organizationId],
    );

    return result.rows.map(toLeadListItem);
  }
}
