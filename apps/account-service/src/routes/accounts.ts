import { Router, Request, Response } from "express";
import { Account, AccountStatus, KYCStatus, generateId, formatCurrency } from "@finserv/common";
import { Logger } from "@finserv/logger";
import { accountStore } from "../data/store";

const logger = new Logger("account-service:accounts");

export const accountsRouter = Router();

accountsRouter.get("/", (req: Request, res: Response) => {
  const accounts = accountStore.getAll();
  const summary = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    balance: formatCurrency(a.balance, a.currency),
    status: a.status,
  }));
  res.json({ data: summary });
});

const BULK_LOOKUP_MAX_IDS = 50;

accountsRouter.post("/bulk-lookup", (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    res.status(400).json({ error: "ids must be an array" });
    return;
  }

  if (ids.length === 0) {
    res.json({ data: [] });
    return;
  }

  if (ids.length > BULK_LOOKUP_MAX_IDS) {
    res
      .status(400)
      .json({ error: `ids array must not exceed ${BULK_LOOKUP_MAX_IDS} items` });
    return;
  }

  const accounts = accountStore.getByIds(ids);
  const data = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    email: account.email,
    balance: account.balance,
    currency: account.currency,
    status: account.status,
    kycStatus: account.kycStatus,
    createdAt: account.createdAt,
  }));

  res.json({ data });
});

accountsRouter.get("/:id", (req: Request, res: Response) => {
  const account = accountStore.getById(req.params.id!);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json({
    data: {
      id: account.id,
      name: account.name,
      email: account.email,
      balance: account.balance,
      currency: account.currency,
      status: account.status,
      kycStatus: account.kycStatus,
      createdAt: account.createdAt,
    },
  });
});

accountsRouter.post("/", (req: Request, res: Response) => {
  const { email, name, currency } = req.body;

  if (!email || !name) {
    res.status(400).json({ error: "email and name are required" });
    return;
  }

  const existing = accountStore.getByEmail(email);
  if (existing) {
    res.status(409).json({ error: "Account with this email already exists" });
    return;
  }

  const account: Account = {
    id: generateId(),
    userId: generateId(),
    email,
    name,
    balance: 0,
    currency: currency || "USD",
    status: AccountStatus.ACTIVE,
    kycStatus: KYCStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  accountStore.create(account);
  logger.info(`Account created: ${account.id}`);

  res.status(200).json({ data: account });
});

accountsRouter.put("/:id", (req: Request, res: Response) => {
  const account = accountStore.getById(req.params.id!);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  const { name, email } = req.body;
  const updated: Account = {
    ...account,
    name: name || account.name,
    email: email || account.email,
    updatedAt: new Date(),
  };

  accountStore.update(updated);
  logger.info(`Account updated: ${updated.id}`);
  res.json({ data: updated });
});

accountsRouter.delete("/:id", (req: Request, res: Response) => {
  const account = accountStore.getById(req.params.id!);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  if (account.balance > 0) {
    res.status(400).json({
      error: "Cannot close account with positive balance. Please withdraw funds first.",
    });
    return;
  }

  const closed: Account = {
    ...account,
    status: AccountStatus.CLOSED,
    updatedAt: new Date(),
  };

  accountStore.update(closed);
  logger.info(`Account closed: ${closed.id}`);
  res.json({ data: { message: "Account closed", id: closed.id } });
});

accountsRouter.post("/:id/deposit", (req: Request, res: Response) => {
  const { amount } = req.body;
  const account = accountStore.getById(req.params.id!);

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  if (account.status !== AccountStatus.ACTIVE) {
    res.status(400).json({ error: "Account is not active" });
    return;
  }

  const updated: Account = {
    ...account,
    balance: account.balance + amount,
    updatedAt: new Date(),
  };

  accountStore.update(updated);
  logger.info(`Deposit of ${amount} to account ${account.id}`);
  res.json({ data: { balance: updated.balance } });
});

accountsRouter.post("/:id/withdraw", (req: Request, res: Response) => {
  const { amount } = req.body;
  const account = accountStore.getById(req.params.id!);

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  if (account.status !== AccountStatus.ACTIVE) {
    res.status(400).json({ error: "Account is not active" });
    return;
  }

  if (account.balance < amount) {
    res.status(400).json({ error: "Insufficient funds" });
    return;
  }

  const updated: Account = {
    ...account,
    balance: account.balance - amount,
    updatedAt: new Date(),
  };

  accountStore.update(updated);
  logger.info(`Withdrawal of ${amount} from account ${account.id}`);
  res.json({ data: { balance: updated.balance } });
});
