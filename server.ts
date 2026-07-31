import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { initDatabase } from "./db/database";
import { optionalAuth } from "./server/auth/middleware";

import authRoutes from "./server/routes/auth.routes";
import leadsRoutes from "./server/routes/leads.routes";
import campaignsRoutes from "./server/routes/campaigns.routes";
import activitiesRoutes from "./server/routes/activities.routes";
import followupsRoutes from "./server/routes/followups.routes";
import notificationsRoutes from "./server/routes/notifications.routes";
import analyticsRoutes from "./server/routes/analytics.routes";
import pipelineRoutes from "./server/routes/pipeline.routes";
import aiRoutes from "./server/routes/ai.routes";
import usersRoutes from "./server/routes/users.routes";
import workspacesRoutes from "./server/routes/workspaces.routes";
import invitationsRoutes from "./server/routes/invitations.routes";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const configuredOrigins = [process.env.CORS_ORIGIN, process.env.APP_URL]
    .flatMap((origins) => (origins || "").split(","))
    .map((origin) => origin.trim())
    .filter(Boolean);
  const isDevelopmentOrigin = (origin: string) =>
    process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin);

  if (process.env.NODE_ENV === "production" && configuredOrigins.length === 0) {
    throw new Error("Set CORS_ORIGIN or APP_URL before starting MIP in production.");
  }

  // Middleware setup
  app.use(cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes(origin) || isDevelopmentOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true
  }));
  app.use(express.json());

  // Initialize PostgreSQL schema and seed data
  await initDatabase();

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ 
      status: "healthy", 
      platform: "Marketing Intelligence Platform (MIP)",
      database: "PostgreSQL",
      timestamp: new Date().toISOString() 
    });
  });

  // Mount modular route controllers
  // Authentication is resolved once here. Individual routes then declare the
  // permission they need, rather than trusting organizationId from the URL.
  app.use("/api", optionalAuth);
  app.use("/api/auth", authRoutes);
  app.use("/api/workspaces", workspacesRoutes);
  app.use("/api/invitations", invitationsRoutes);
  app.use("/api/leads", leadsRoutes);
  app.use("/api/campaigns", campaignsRoutes);
  app.use("/api/activities", activitiesRoutes);
  app.use("/api/followups", followupsRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api", pipelineRoutes);

  // Global Error Handler Middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("[MIP Backend Error]:", err);
    res.status(err.status || 500).json({
      error: err.message || "An unexpected internal backend error occurred."
    });
  });

  // Vite middleware setup for client asset serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[MIP HOST] Express + Vite backend operational on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL: Failed to initiate MIP backend server: ", err);
  process.exit(1);
});
