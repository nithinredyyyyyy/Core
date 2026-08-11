import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { entityConfigs } from "../db.js";
import { splitTrimmedValues } from "./schemas.js";

const ADMIN_WRITE_ENTITIES = new Set(Object.keys(entityConfigs));

export const AUTH_SESSION_SECRET = String(
  process.env.CORE_AUTH_SESSION_SECRET || randomUUID(),
);

export const GOOGLE_CLIENT_ID = String(
  process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "",
).trim();

const ADMIN_EMAILS = new Set(
  splitTrimmedValues(
    process.env.CORE_ADMIN_EMAILS || "sathkrishna3@gmail.com",
  ).map((value) => value.toLowerCase()),
);

function encodeTokenSegment(value) {
  return Buffer.from(String(value), "utf8").toString("base64url");
}

function decodeTokenSegment(value) {
  return Buffer.from(String(value), "base64url").toString("utf8");
}

function signAuthSessionPayload(encodedPayload) {
  return createHmac("sha256", AUTH_SESSION_SECRET)
    .update(String(encodedPayload))
    .digest("base64url");
}

export function createAuthSession(user) {
  const payload = {
    userId: String(user?.id || "").trim() || `user-${randomUUID()}`,
    email: String(user?.email || "").trim(),
    fullName: String(user?.full_name || user?.displayName || "").trim(),
    role: String(user?.role || "member").trim() || "member",
    authMethod: String(user?.auth_method || "custom").trim() || "custom",
    issuedAt: new Date().toISOString(),
  };
  const encodedPayload = encodeTokenSegment(JSON.stringify(payload));
  const signature = signAuthSessionPayload(encodedPayload);

  return {
    user: {
      id: payload.userId,
      email: payload.email,
      full_name: payload.fullName,
      role: payload.role,
      auth_method: payload.authMethod,
    },
    token: `${encodedPayload}.${signature}`,
  };
}

function resolveAppAuthSession(req) {
  const rawToken = String(req.headers["x-stagecore-auth-token"] || "").trim();
  if (!rawToken) return null;

  const [encodedPayload, providedSignature] = rawToken.split(".");
  if (!encodedPayload || !providedSignature) return null;

  const expectedSignature = signAuthSessionPayload(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeTokenSegment(encodedPayload));
    if (!payload?.userId) {
      return null;
    }

    return {
      token: rawToken,
      user: {
        id: String(payload.userId),
        email: String(payload.email || ""),
        full_name: String(payload.fullName || ""),
        role: String(payload.role || "member"),
        auth_method: String(payload.authMethod || "custom"),
      },
      issuedAt: payload.issuedAt || null,
    };
  } catch {
    return null;
  }
}

export function resolveRequestAuth(req) {
  const configuredAdminKey = String(process.env.CORE_ADMIN_KEY || "").trim();
  const providedAdminKey = String(req.headers["x-core-admin-key"] || "").trim();

  if (configuredAdminKey && providedAdminKey) {
    const configuredBuf = Buffer.from(configuredAdminKey, "utf8");
    const providedBuf = Buffer.from(providedAdminKey, "utf8");
    if (configuredBuf.length === providedBuf.length && timingSafeEqual(configuredBuf, providedBuf)) {
      return {
        isAuthenticated: true,
        user: {
          id: "token-admin",
          email: "admin@core.remote",
          full_name: "Remote Admin",
          role: "admin",
          auth_method: "admin_key",
        },
      };
    }
  }

  const appSession = resolveAppAuthSession(req);
  if (appSession?.user) {
    return {
      isAuthenticated: true,
      user: appSession.user,
    };
  }

  return {
    isAuthenticated: false,
    user: null,
  };
}

export function isConfiguredAdminEmail(email) {
  return ADMIN_EMAILS.has(String(email || "").trim().toLowerCase());
}

export function requireAdminAccess(req, res) {
  const auth = resolveRequestAuth(req);
  if (!auth.isAuthenticated) {
    res.status(401).json({
      error: "Not authenticated",
      code: "auth_required",
    });
    return false;
  }
  if (auth.user?.role !== "admin") {
    res.status(403).json({
      error: "Admin permission required",
      code: "admin_required",
    });
    return false;
  }
  req.coreAuth = auth;
  return true;
}

export function ensureEntityWriteAccess(req, res, entityName) {
  if (!ADMIN_WRITE_ENTITIES.has(entityName)) {
    return null;
  }

  const auth = resolveRequestAuth(req);
  if (!auth.isAuthenticated || auth.user?.role !== "admin") {
    res.status(403).json({
      error: "Admin permission required",
      code: "admin_required",
    });
    return false;
  }

  req.coreAuth = auth;
  return true;
}
