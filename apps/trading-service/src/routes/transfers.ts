import { Router, Request, Response } from "express";
import { TransferRequest, generateId } from "@finserv/common";
import { Logger } from "@finserv/logger";

const logger = new Logger("trading-service:transfers");

export const transfersRouter = Router();

interface BalanceRecord {
  accountId: string;
  balance: number;
  currency: string;
}

const balances = new Map<string, BalanceRecord>([
  ["acc-001", { accountId: "acc-001", balance: 50000, currency: "USD" }],
  ["acc-002", { accountId: "acc-002", balance: 125000, currency: "USD" }],
  ["acc-003", { accountId: "acc-003", balance: 5000, currency: "USD" }],
]);

interface TransferRecord {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
}

const transferHistory: TransferRecord[] = [];

transfersRouter.post("/", async (req: Request, res: Response) => {
  const { fromAccountId, toAccountId, amount, currency }: TransferRequest =
    req.body;

  if (!fromAccountId || !toAccountId || !amount) {
    res.status(400).json({ error: "fromAccountId, toAccountId, and amount are required" });
    return;
  }

  if (fromAccountId === toAccountId) {
    res.status(400).json({ error: "Cannot transfer to the same account" });
    return;
  }

  const fromBalance = balances.get(fromAccountId);
  const toBalance = balances.get(toAccountId);

  if (!fromBalance) {
    res.status(404).json({ error: `Source account ${fromAccountId} not found` });
    return;
  }

  if (!toBalance) {
    res.status(404).json({ error: `Destination account ${toAccountId} not found` });
    return;
  }

  if (fromBalance.balance < amount) {
    res.status(400).json({
      error: "Insufficient funds",
      available: fromBalance.balance,
      requested: amount,
    });
    return;
  }

  const transferId = generateId();

  const transfer: TransferRecord = {
    id: transferId,
    fromAccountId,
    toAccountId,
    amount,
    currency: currency || "USD",
    status: "pending",
    createdAt: new Date(),
  };
  transferHistory.push(transfer);

  await simulateProcessingDelay();

  const currentFromBalance = balances.get(fromAccountId)!;
  currentFromBalance.balance -= amount;

  const currentToBalance = balances.get(toAccountId)!;
  currentToBalance.balance += amount;

  transfer.status = "completed";
  transfer.completedAt = new Date();

  logger.info(`Transfer completed: ${transferId}`, {
    from: fromAccountId,
    to: toAccountId,
    amount,
  });

  res.status(200).json({ data: transfer });
});

transfersRouter.get("/history", (req: Request, res: Response) => {
  const accountId = req.query.accountId as string;

  let transfers = transferHistory;
  if (accountId) {
    transfers = transfers.filter(
      (t) => t.fromAccountId === accountId || t.toAccountId === accountId
    );
  }

  res.json({ data: transfers });
});

function simulateProcessingDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 50));
}
