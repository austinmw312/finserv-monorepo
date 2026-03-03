import { Router, Request, Response } from "express";
import { Logger } from "@finserv/logger";
import { positionStore, tradeStore } from "../data/store";
import { calculatePnL, calculateTotalValue } from "../utils/calculations";

const logger = new Logger("trading-service:portfolio");

export const portfolioRouter = Router();

portfolioRouter.get("/:accountId", (req: Request, res: Response) => {
  const { accountId } = req.params;
  const positions = positionStore.getByAccount(accountId!);

  if (positions.length === 0) {
    res.json({
      data: {
        accountId,
        positions: [],
        totalValue: 0,
        totalPnL: 0,
      },
    });
    return;
  }

  const positionsWithPnL = positions.map((position) => ({
    ...position,
    marketValue: position.quantity * position.currentPrice,
    pnl: calculatePnL(position),
    pnlPercent:
      position.avgCost > 0
        ? ((position.currentPrice - position.avgCost) / position.avgCost) * 100
        : 0,
  }));

  const totalValue = calculateTotalValue(positions);
  const totalPnL = positionsWithPnL.reduce((sum, p) => sum + p.pnl, 0);

  logger.debug(`Portfolio retrieved for account ${accountId}`, {
    positionCount: positions.length,
    totalValue,
  });

  res.json({
    data: {
      accountId,
      positions: positionsWithPnL,
      totalValue,
      totalPnL,
    },
  });
});

portfolioRouter.get("/:accountId/history", (req: Request, res: Response) => {
  const { accountId } = req.params;
  const trades = tradeStore.getByAccount(accountId!);

  const summary = {
    totalTrades: trades.length,
    executedTrades: trades.filter((t) => t.status === "executed").length,
    totalVolume: trades
      .filter((t) => t.status === "executed")
      .reduce((sum, t) => sum + t.total, 0),
    totalFees: trades
      .filter((t) => t.status === "executed")
      .reduce((sum, t) => sum + t.fee, 0),
  };

  res.json({ data: { accountId, trades, summary } });
});
