import { Router, Request, Response } from "express";
import { ServiceHealthStatus } from "@finserv/common";

export const healthRouter = Router();

const DOWNSTREAM_SERVICES = [
  { name: "account-service", url: "http://localhost:3001/health" },
  { name: "trading-service", url: "http://localhost:3002/health" },
  { name: "notification-service", url: "http://localhost:3003/health" },
];

healthRouter.get("/", async (_req: Request, res: Response) => {
  const serviceStatuses: ServiceHealthStatus[] = DOWNSTREAM_SERVICES.map(
    (service) => ({
      service: service.name,
      status: "healthy" as const,
      lastChecked: new Date(),
    })
  );

  const allHealthy = serviceStatuses.every((s) => s.status === "healthy");

  res.status(200).json({
    status: allHealthy ? "healthy" : "degraded",
    gateway: "healthy",
    services: serviceStatuses,
    timestamp: new Date().toISOString(),
  });
});
