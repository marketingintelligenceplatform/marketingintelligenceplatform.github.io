import { Router } from "express";
import { WorkspaceService } from "../modules/workspaces/workspace.service";

const router = Router();
const workspaces = new WorkspaceService();

router.post("/accept", async (request, response, next) => {
  try {
    response.status(201).json(await workspaces.acceptInvitation(request.body ?? {}, request.identity));
  } catch (error) { next(error); }
});

export default router;
