/**
 * API-facing lead shape. Its field names preserve the current React model
 * while nullable fields honestly reflect values the authoritative schema does
 * not yet store, such as lead scoring.
 */
export interface LeadListItem {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  stage: string;
  source: string;
  leadScore: number | null;
  assignee: string;
  dateCreated: string;
  lastUpdated: string;
  notes: string;
}
