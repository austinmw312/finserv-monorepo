import { Request, Response, NextFunction } from "express";
import { AppError } from "@finserv/common";
import { Logger } from "@finserv/logger";

const logger = new Logger("api-gateway:error");

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
    });
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
