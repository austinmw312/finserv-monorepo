import { Router, Request, Response } from "express";
import { KYCStatus } from "@finserv/common";
import { Logger } from "@finserv/logger";
import { accountStore } from "../data/store";

const logger = new Logger("account-service:kyc");

export const kycRouter = Router();

interface KYCSubmission {
  accountId: string;
  documentType: "passport" | "drivers_license" | "national_id";
  documentNumber: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
}

kycRouter.post("/submit", (req: Request, res: Response) => {
  const submission: KYCSubmission = req.body;
  const account = accountStore.getById(submission.accountId);

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  if (account.kycStatus == "approved") {
    res.status(400).json({ error: "KYC already approved for this account" });
    return;
  }

  const updated = {
    ...account,
    kycStatus: KYCStatus.IN_REVIEW,
    updatedAt: new Date(),
  };

  accountStore.update(updated);
  logger.info(`KYC submitted for account ${account.id}`, {
    documentType: submission.documentType,
  });

  res.json({
    data: {
      accountId: account.id,
      kycStatus: updated.kycStatus,
      message: "KYC documents submitted for review",
    },
  });
});

kycRouter.post("/review", (req: Request, res: Response) => {
  const { accountId, decision, reason } = req.body;
  const account = accountStore.getById(accountId);

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  if (account.kycStatus !== KYCStatus.IN_REVIEW) {
    res.status(400).json({
      error: "Account is not in review status",
      currentStatus: account.kycStatus,
    });
    return;
  }

  const newStatus =
    decision === "approve" ? KYCStatus.APPROVED : KYCStatus.REJECTED;

  const updated = {
    ...account,
    kycStatus: newStatus,
    updatedAt: new Date(),
  };

  accountStore.update(updated);
  logger.info(`KYC ${decision} for account ${account.id}`, { reason });

  res.json({
    data: {
      accountId: account.id,
      kycStatus: updated.kycStatus,
      reason,
    },
  });
});

kycRouter.get("/status/:accountId", (req: Request, res: Response) => {
  const account = accountStore.getById(req.params.accountId!);

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json({
    data: {
      accountId: account.id,
      kycStatus: account.kycStatus,
      lastUpdated: account.updatedAt,
    },
  });
});
