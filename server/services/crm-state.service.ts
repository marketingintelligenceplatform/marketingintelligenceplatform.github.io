import {
  getActivitiesFromDb,
  getCampaignsFromDb,
  getFollowUpsFromDb,
  getLeadsFromDb,
  getNotificationsFromDb,
  getPipelineStagesFromDb,
} from "../../db/database";

// This internal service preserves the React client's existing state-snapshot
// shape while the PostgreSQL route experiment is being assessed.
export async function getCrmState(organizationId = "org-default") {
  const [pipelineStages, leads, campaigns, activities, followups, notifications] = await Promise.all([
    getPipelineStagesFromDb(organizationId),
    getLeadsFromDb(organizationId),
    getCampaignsFromDb(organizationId),
    getActivitiesFromDb(organizationId),
    getFollowUpsFromDb(organizationId),
    getNotificationsFromDb(organizationId),
  ]);

  return { pipelineStages, leads, campaigns, activities, followups, notifications };
}
