import { Position, Trade, formatCurrency } from "@finserv/common";

export function calculatePnL(position: Position): number {
  return (position.currentPrice - position.avgCost) * position.quantity;
}

export function calculateTotalValue(positions: Position[]): number {
  return positions.reduce(
    (total, position) => total + position.quantity * position.currentPrice,
    0
  );
}

export function calculateDailyReturn(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

export function calculateFeeBreakdown(
  trades: Trade[]
): { total: number; average: number; summary: string } {
  const executedTrades = trades.filter((t) => t.status === "executed");
  if (executedTrades.length === 0) {
    return { total: 0, average: 0, summary: "No executed trades" };
  }

  const totalFees = executedTrades.reduce((sum, t) => sum + t.fee, 0);
  const averageFee = totalFees / executedTrades.length;

  return {
    total: totalFees,
    average: averageFee,
    summary: `Total fees: ${formatCurrency(totalFees, "USD")} across ${executedTrades.length} trades`,
  };
}

export function calculatePortfolioAllocation(
  positions: Position[]
): { symbol: string; percentage: number; value: number }[] {
  const totalValue = calculateTotalValue(positions);
  if (totalValue === 0) return [];

  return positions.map((p) => {
    const value = p.quantity * p.currentPrice;
    return {
      symbol: p.symbol,
      percentage: (value / totalValue) * 100,
      value,
    };
  });
}
