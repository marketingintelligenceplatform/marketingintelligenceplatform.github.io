import { LeadRepository } from "../repositories/lead.repository";
import type { LeadListItem } from "../types/lead";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class LeadService {
  constructor(private readonly leadRepository: LeadRepository) {}

  async listForOrganization(organizationId: string): Promise<LeadListItem[]> {
    if (!uuidPattern.test(organizationId)) {
      throw new InvalidOrganizationIdError();
    }

    return this.leadRepository.findByOrganizationId(organizationId);
  }
}

export class InvalidOrganizationIdError extends Error {
  constructor() {
    super("organizationId must be a valid UUID.");
  }
}
