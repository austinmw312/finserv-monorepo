import express from "express";
import { healthRouter } from "./routes/health";
import { proxyRouter } from "./routes/proxy";
import { rateLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import { authMiddleware } from "@finserv/auth";
import { Logger } from "@finserv/logger";

const logger = new Logger("api-gateway");

export const app = express();

app.use(express.json());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  next();
});

app.use("/health", healthRouter);

app.use(rateLimiter);
app.use(authMiddleware);

app.use("/api", proxyRouter);

app.use(errorHandler);
