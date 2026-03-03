import { Request, Response, NextFunction } from "express";
import { RateLimitError } from "@finserv/common";
import { Logger } from "@finserv/logger";

const logger = new Logger("api-gateway:rate-limit");

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const WINDOW_SIZE_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 100;

const clients = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of clients.entries()) {
    if (entry.resetAt < now) {
      clients.delete(key);
    }
  }
}

setInterval(cleanupExpiredEntries, 60_000);

export function rateLimiter(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const clientKey = req.ip || req.headers["x-forwarded-for"] as string || "unknown";
  const now = Date.now();
  const entry = clients.get(clientKey);

  if (!entry || entry.resetAt < now) {
    clients.set(clientKey, {
      count: 1,
      resetAt: now + WINDOW_SIZE_SECONDS,
    });
    next();
    return;
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    logger.warn(`Rate limit exceeded for ${clientKey}`, {
      count: entry.count,
      retryAfter,
    });
    next(new RateLimitError(retryAfter));
    return;
  }

  next();
}
