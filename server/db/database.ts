// Transitional module boundary: route modules depend on server-owned imports,
// while the existing SQL repository remains in /db during Phase 1.
export * from "../../db/database";
