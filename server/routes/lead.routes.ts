import { Router } from "express";
import { listLeads } from "../controllers/lead.controller";

const router = Router();

// New routes are migrated independently; this router owns only the lead read path.
router.get("/", listLeads);

export default router;
