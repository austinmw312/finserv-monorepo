import { Trade, TradeStatus, Position } from "@finserv/common";

class TradeStore {
  private trades: Map<string, Trade> = new Map();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const seedTrades: Trade[] = [
      {
        id: "trd-001",
        accountId: "acc-001",
        symbol: "AAPL",
        side: "buy",
        quantity: 100,
        price: 178.5,
        total: 17850,
        fee: 17.85,
        status: TradeStatus.EXECUTED,
        createdAt: new Date("2024-10-15T10:30:00Z"),
        executedAt: new Date("2024-10-15T10:30:01Z"),
      },
      {
        id: "trd-002",
        accountId: "acc-001",
        symbol: "GOOGL",
        side: "buy",
        quantity: 50,
        price: 141.8,
        total: 7090,
        fee: 7.09,
        status: TradeStatus.EXECUTED,
        createdAt: new Date("2024-10-16T14:15:00Z"),
        executedAt: new Date("2024-10-16T14:15:01Z"),
      },
      {
        id: "trd-003",
        accountId: "acc-002",
        symbol: "MSFT",
        side: "buy",
        quantity: 200,
        price: 378.9,
        total: 75780,
        fee: 75.78,
        status: TradeStatus.EXECUTED,
        createdAt: new Date("2024-11-01T09:00:00Z"),
        executedAt: new Date("2024-11-01T09:00:01Z"),
      },
      {
        id: "trd-004",
        accountId: "acc-001",
        symbol: "NVDA",
        side: "buy",
        quantity: 75,
        price: 475.0,
        total: 35625,
        fee: 35.63,
        status: TradeStatus.EXECUTED,
        createdAt: new Date("2024-11-10T11:45:00Z"),
        executedAt: new Date("2024-11-10T11:45:01Z"),
      },
      {
        id: "trd-005",
        accountId: "acc-002",
        symbol: "AAPL",
        side: "sell",
        quantity: 30,
        price: 182.0,
        total: 5460,
        fee: 5.46,
        status: TradeStatus.PENDING,
        createdAt: new Date("2024-12-01T16:00:00Z"),
      },
    ];

    for (const trade of seedTrades) {
      this.trades.set(trade.id, trade);
    }
  }

  getAll(): Trade[] {
    return Array.from(this.trades.values());
  }

  getById(id: string): Trade | undefined {
    return this.trades.get(id);
  }

  getByAccount(accountId: string): Trade[] {
    return Array.from(this.trades.values()).filter(
      (t) => t.accountId === accountId
    );
  }

  create(trade: Trade): void {
    this.trades.set(trade.id, trade);
  }

  update(trade: Trade): void {
    this.trades.set(trade.id, trade);
  }
}

class PositionStore {
  private positions: Map<string, Position> = new Map();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const seedPositions: Position[] = [
      {
        accountId: "acc-001",
        symbol: "AAPL",
        quantity: 100,
        avgCost: 178.5,
        currentPrice: 185.2,
      },
      {
        accountId: "acc-001",
        symbol: "GOOGL",
        quantity: 50,
        avgCost: 141.8,
        currentPrice: 148.5,
      },
      {
        accountId: "acc-001",
        symbol: "NVDA",
        quantity: 75,
        avgCost: 475.0,
        currentPrice: 520.3,
      },
      {
        accountId: "acc-002",
        symbol: "MSFT",
        quantity: 200,
        avgCost: 378.9,
        currentPrice: 385.6,
      },
    ];

    for (const position of seedPositions) {
      const key = `${position.accountId}:${position.symbol}`;
      this.positions.set(key, position);
    }
  }

  getPosition(accountId: string, symbol: string): Position | undefined {
    return this.positions.get(`${accountId}:${symbol}`);
  }

  getByAccount(accountId: string): Position[] {
    return Array.from(this.positions.values()).filter(
      (p) => p.accountId === accountId
    );
  }

  setPosition(accountId: string, symbol: string, position: Position): void {
    this.positions.set(`${accountId}:${symbol}`, position);
  }
}

export const tradeStore = new TradeStore();
export const positionStore = new PositionStore();
