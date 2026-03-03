import express from "express";
import { notificationsRouter } from "./routes/notifications";
import { Logger } from "@finserv/logger";

const logger = new Logger("notification-service");

export const app = express();

app.use(express.json());

app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

app.use("/notifications", notificationsRouter);
