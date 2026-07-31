import { getCrmState } from "./crm-state.service";

export interface AiDashboardContext {
  totalLeads: number;
  activeLeads: number;
  conversionRate: string;
  wonDeals: number;
  revenueGenerated: string;
}

export async function getAiDashboardContext(organizationId: string): Promise<AiDashboardContext> {
  const { leads } = await getCrmState(organizationId);
  const closedLeads = leads.filter((lead) => lead.stage === "Won" || lead.stage === "Lost");
  const wonDeals = leads.filter((lead) => lead.stage === "Won");
  const revenueGenerated = wonDeals.reduce((sum, lead) => sum + lead.value, 0);
  const conversionRate = closedLeads.length === 0
    ? 0
    : Math.round((wonDeals.length / closedLeads.length) * 100);

  return {
    totalLeads: leads.length,
    activeLeads: leads.filter((lead) => lead.stage !== "Won" && lead.stage !== "Lost").length,
    conversionRate: `${conversionRate}%`,
    wonDeals: wonDeals.length,
    revenueGenerated: revenueGenerated.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }),
  };
}
