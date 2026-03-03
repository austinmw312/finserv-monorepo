import { Router, Request, Response } from "express";
import {
  Trade,
  TradeStatus,
  PaginatedResponse,
  generateId,
  calculateFee,
} from "@finserv/common";
import { Logger } from "@finserv/logger";
import { tradeStore, positionStore } from "../data/store";
import { validateTradeRequest } from "../utils/validation";

const logger = new Logger("trading-service:trades");

const FEE_RATE = 0.001;

export const tradesRouter = Router();

tradesRouter.get("/", (req: Request, res: Response) => {
  const accountId = req.query.accountId as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  let trades = tradeStore.getAll();

  if (accountId) {
    trades = trades.filter((t) => t.accountId === accountId);
  }

  trades.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = trades.length;
  const offset = page * limit;
  const paginated = trades.slice(offset, offset + limit);

  const response: PaginatedResponse<Trade> = {
    data: paginated,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  };

  res.json(response);
});

tradesRouter.get("/:id", (req: Request, res: Response) => {
  const trade = tradeStore.getById(req.params.id!);

  if (!trade) {
    res.status(404).json({ error: "Trade not found" });
    return;
  }

  res.json({ data: trade });
});

tradesRouter.post("/", (req: Request, res: Response) => {
  const { accountId, symbol, side, quantity, price } = req.body;

  const validationError = validateTradeRequest({
    accountId,
    symbol,
    side,
    quantity,
    price,
  });

  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const total = quantity * price;
  const fee = calculateFee(total, FEE_RATE);

  const trade: Trade = {
    id: generateId(),
    accountId,
    symbol: symbol.toUpperCase(),
    side,
    quantity,
    price,
    total,
    fee,
    status: TradeStatus.PENDING,
    createdAt: new Date(),
  };

  tradeStore.create(trade);
  logger.info(`Trade created: ${trade.id}`, {
    symbol: trade.symbol,
    side: trade.side,
    quantity: trade.quantity,
    total: trade.total,
  });

  setTimeout(() => {
    executeTrade(trade.id);
  }, 100);

  res.status(201).json({ data: trade });
});

function executeTrade(tradeId: string): void {
  const trade = tradeStore.getById(tradeId);
  if (!trade || trade.status !== TradeStatus.PENDING) return;

  try {
    const updatedTrade: Trade = {
      ...trade,
      status: TradeStatus.EXECUTED,
      executedAt: new Date(),
    };
    tradeStore.update(updatedTrade);

    const position = positionStore.getPosition(trade.accountId, trade.symbol);
    if (trade.side === "buy") {
      const newQty = (position?.quantity || 0) + trade.quantity;
      const existingCost = (position?.quantity || 0) * (position?.avgCost || 0);
      const newCost = existingCost + trade.total;
      positionStore.setPosition(trade.accountId, trade.symbol, {
        accountId: trade.accountId,
        symbol: trade.symbol,
        quantity: newQty,
        avgCost: newCost / newQty,
        currentPrice: trade.price,
      });
    } else {
      if (position) {
        const newQty = position.quantity - trade.quantity;
        positionStore.setPosition(trade.accountId, trade.symbol, {
          ...position,
          quantity: newQty,
          currentPrice: trade.price,
        });
      }
    }

    logger.info(`Trade executed: ${tradeId}`);
  } catch (error) {
    const failedTrade: Trade = {
      ...trade,
      status: TradeStatus.FAILED,
    };
    tradeStore.update(failedTrade);
    logger.error(`Trade execution failed: ${tradeId}`, error as Error);
  }
}

tradesRouter.post("/:id/cancel", (req: Request, res: Response) => {
  const trade = tradeStore.getById(req.params.id!);

  if (!trade) {
    res.status(404).json({ error: "Trade not found" });
    return;
  }

  if (trade.status !== TradeStatus.PENDING) {
    res.status(400).json({
      error: `Cannot cancel trade with status '${trade.status}'`,
    });
    return;
  }

  const cancelled: Trade = {
    ...trade,
    status: TradeStatus.CANCELLED,
  };

  tradeStore.update(cancelled);
  logger.info(`Trade cancelled: ${trade.id}`);
  res.json({ data: cancelled });
});
