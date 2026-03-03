import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "./jwt";
import { Role, checkPermission, Permission } from "./roles";
import { UnauthorizedError, ForbiddenError } from "@finserv/common";
import { Logger } from "@finserv/logger";

const logger = new Logger("auth");

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing or invalid Authorization header"));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    logger.debug(`Authenticated user ${payload.userId} with role ${payload.role}`);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication required"));
      return;
    }

    const userRole = req.user.role as Role;
    if (!roles.includes(userRole)) {
      logger.warn(
        `User ${req.user.userId} with role ${userRole} attempted to access resource requiring ${roles.join(", ")}`
      );
      next(new ForbiddenError(`Requires one of: ${roles.join(", ")}`));
      return;
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication required"));
      return;
    }

    const userRole = req.user.role as Role;
    if (!checkPermission(userRole, permission)) {
      logger.warn(
        `User ${req.user.userId} denied permission ${permission}`
      );
      next(new ForbiddenError(`Missing permission: ${permission}`));
      return;
    }

    next();
  };
}
