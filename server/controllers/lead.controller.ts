import type { NextFunction, Request, Response } from "express";
import { LeadRepository } from "../repositories/lead.repository";
import { InvalidOrganizationIdError, LeadService } from "../services/lead.service";

const leadService = new LeadService(new LeadRepository());

/** HTTP boundary for lead requests. It does not contain SQL or lead rules. */
export async function listLeads(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const organizationId = request.query.organizationId;
    if (typeof organizationId !== "string") {
      response.status(400).json({ error: "organizationId is required." });
      return;
    }

    const leads = await leadService.listForOrganization(organizationId);
    response.json(leads);
  } catch (error) {
    if (error instanceof InvalidOrganizationIdError) {
      response.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
}
