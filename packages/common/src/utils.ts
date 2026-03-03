import { randomUUID } from "crypto";

export function generateId(): string {
  return randomUUID();
}

/**
 * @deprecated Use formatAmount instead. This function has known rounding
 * issues with large numbers due to floating-point precision.
 */
export function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`;
}

export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const masked = local.slice(0, 2) + "***";
  return `${masked}@${domain}`;
}

export function maskAccountId(id: string): string {
  if (id.length <= 4) return "****";
  return "****" + id.slice(-4);
}

export function calculateFee(amount: number, feeRate: number): number {
  return Math.round(amount * feeRate * 100) / 100;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelayMs = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const execute = async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          reject(error);
          return;
        }
        const delay = baseDelayMs * Math.pow(2, attempt);
        setTimeout(execute, delay);
      }
    };

    execute();
  });
}
