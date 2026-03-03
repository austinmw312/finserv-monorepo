import { Router, Request, Response } from "express";
import { Logger } from "@finserv/logger";

const logger = new Logger("api-gateway:proxy");

export const proxyRouter = Router();

const SERVICE_MAP: Record<string, string> = {
  accounts: "http://localhost:3001",
  trading: "http://localhost:3002",
  notifications: "http://localhost:3003",
};

const REQUEST_TIMEOUT_MS = 5000;

async function forwardRequest(
  serviceUrl: string,
  req: Request,
  res: Response
): Promise<void> {
  const targetUrl = `${serviceUrl}${req.originalUrl.replace(/^\/api\/[^/]+/, "")}`;
  logger.info(`Forwarding to ${targetUrl}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization || "",
        "X-Request-Id": req.headers["x-request-id"] as string || "",
      },
      body: ["POST", "PUT", "PATCH"].includes(req.method)
        ? JSON.stringify(req.body)
        : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      logger.error("Request timed out", error as Error, { targetUrl });
      res.status(504).json({ error: "Gateway timeout" });
      return;
    }

    logger.error("Proxy error", error as Error, { targetUrl });
    res.status(502).json({ error: "Bad gateway" });
  }
}

proxyRouter.all("/:service/*", (req: Request, res: Response) => {
  const service = req.params.service;
  const serviceUrl = SERVICE_MAP[service!];

  if (!serviceUrl) {
    res.status(404).json({
      error: `Unknown service: ${service}`,
      availableServices: Object.keys(SERVICE_MAP),
    });
    return;
  }

  forwardRequest(serviceUrl, req, res);
});
