const VALID_SYMBOLS = [
  "AAPL",
  "GOOGL",
  "MSFT",
  "AMZN",
  "META",
  "TSLA",
  "NVDA",
  "JPM",
  "BAC",
  "GS",
  "MS",
  "WFC",
  "V",
  "MA",
  "BRK.B",
];

interface TradeRequest {
  accountId: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
}

export function validateTradeRequest(request: TradeRequest): string | null {
  if (!request.accountId) {
    return "accountId is required";
  }

  if (!request.symbol) {
    return "symbol is required";
  }

  const upperSymbol = request.symbol.toUpperCase();
  if (!VALID_SYMBOLS.includes(upperSymbol)) {
    return `Invalid symbol: ${request.symbol}. Valid symbols: ${VALID_SYMBOLS.join(", ")}`;
  }

  if (!request.side || !["buy", "sell"].includes(request.side)) {
    return "side must be 'buy' or 'sell'";
  }

  if (!request.quantity || typeof request.quantity !== "number") {
    return "quantity must be a number";
  }

  if (!request.price || typeof request.price !== "number") {
    return "price must be a number";
  }

  if (request.price <= 0) {
    return "price must be positive";
  }

  return null;
}

export function validateSymbol(symbol: string): boolean {
  return VALID_SYMBOLS.includes(symbol.toUpperCase());
}
