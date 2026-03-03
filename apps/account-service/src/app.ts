import express from "express";
import { accountsRouter } from "./routes/accounts";
import { kycRouter } from "./routes/kyc";
import { Logger } from "@finserv/logger";

const logger = new Logger("account-service");

export const app = express();

app.use(express.json());

app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "account-service" });
});

app.use("/accounts", accountsRouter);
app.use("/kyc", kycRouter);
