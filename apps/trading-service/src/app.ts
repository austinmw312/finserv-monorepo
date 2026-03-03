import express from "express";
import { tradesRouter } from "./routes/trades";
import { portfolioRouter } from "./routes/portfolio";
import { transfersRouter } from "./routes/transfers";
import { Logger } from "@finserv/logger";

const logger = new Logger("trading-service");

export const app = express();

app.use(express.json());

app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "trading-service" });
});

app.use("/trades", tradesRouter);
app.use("/portfolio", portfolioRouter);
app.use("/transfers", transfersRouter);
