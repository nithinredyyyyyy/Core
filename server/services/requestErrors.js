import { randomUUID } from "node:crypto";
import { z } from "zod";
import { logger } from "./logger.js";

const MESSAGES = {
  400: "Invalid request",
  401: "Not authenticated",
  403: "Access denied",
  404: "Not found",
  413: "Request too large",
  429: "Too many requests, please try again later",
};

export function requestContext(req, res, next) {
  // Do not trust a caller-supplied id in logs or responses.
  req.requestId = randomUUID();
  res.setHeader("X-Request-ID", req.requestId);
  const json = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400) {
      return json({
        error: MESSAGES[res.statusCode] || "Internal server error",
        ...(typeof body?.code === "string" ? { code: body.code } : {}),
        requestId: req.requestId,
      });
    }
    return json(body);
  };
  next();
}

export function logRequestError(req, error) {
  // OAuth errors can embed credentials; parser errors can embed request bodies.
  // Record diagnostic class/code and stack locations, never their raw message,
  // headers, cookies, body, URL query or provider response.
  logger.error("Request failed", {
    requestId: req.requestId,
    method: req.method,
    route: req.route?.path || "middleware",
    kind: error instanceof z.ZodError ? "validation" : "request",
    code: typeof error?.code === "string" && /^[A-Z_]{1,64}$/.test(error.code)
      ? error.code : undefined,
    stack: typeof error?.stack === "string"
      ? error.stack.split("\n").filter((line) => /^\s+at /.test(line)).slice(0, 8)
      : undefined,
  });
}

export function sendRequestError(req, res, error, status = 500) {
  logRequestError(req, error);
  return res.status(error instanceof z.ZodError ? 400 : status).json({});
}

export function requestErrorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error?.type === "entity.too.large" ? 413
    : error?.type === "entity.parse.failed" ? 400
      : error?.code === "CORS_ORIGIN_DENIED" ? 403 : 500;
  return sendRequestError(req, res, error, status);
}
