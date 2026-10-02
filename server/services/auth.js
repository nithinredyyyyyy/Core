import { createHmac, randomBytes, randomUUID, timingSafeEqual, createHash } from "node:crypto";
import { db, entityConfigs } from "../db.js";
import { splitTrimmedValues } from "./schemas.js";
import { logger } from "./logger.js";
import { createSessionRevocationStore } from "./sessionRevocations.js";

const ADMIN_WRITE_ENTITIES = new Set(Object.keys(entityConfigs));

const isProduction = process.env.NODE_ENV === "production";

export const AUTH_SESSION_SECRET = String(
  process.env.CORE_AUTH_SESSION_SECRET || "",
);
if (isProduction && !AUTH_SESSION_SECRET) {
  logger.error(
    "CORE_AUTH_SESSION_SECRET is not set. Refusing to start in production — set it to a stable 32+ byte secret.",
  );
  throw new Error("CORE_AUTH_SESSION_SECRET is required in production");
}
const EFFECTIVE_SECRET = AUTH_SESSION_SECRET || randomBytes(32).toString("hex");

export const GOOGLE_CLIENT_ID = String(
  process.env.GOOGLE_CLIENT_ID || "",
).trim();
if (isProduction && !GOOGLE_CLIENT_ID) {
  logger.warn("GOOGLE_CLIENT_ID is not set. Google sign-in will be disabled.");
}

const ADMIN_EMAILS = new Set(
  splitTrimmedValues(process.env.CORE_ADMIN_EMAILS || "")
    .map((value) => value.toLowerCase()),
);

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

const revocations = createSessionRevocationStore(db);

export const AUTH_COOKIE_NAME = "stagecore_auth_token";
export const CSRF_COOKIE_NAME = "stagecore_csrf";
export const CSRF_HEADER_NAME = "x-stagecore-csrf";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);


function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

function parseCookies(req) {
  const header = req?.headers?.cookie;
  if (!header) return {};
  const cookies = {};
  for (const part of String(header).split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (!key) continue;
    const value = part.slice(separator + 1).trim();
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }
  return cookies;
}

function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left), "utf8");
  const rightBuffer = Buffer.from(String(right), "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getSessionToken(req) {
  const cookies = parseCookies(req);
  const cookieToken = cookies[AUTH_COOKIE_NAME];
  return cookieToken ? String(cookieToken).trim() : "";
}

// Same-origin deploys (Express serving the built SPA) work with "lax"; the
// Vercel preview frontend calls the API cross-site, which requires "none"
// (browser-enforced Secure) and leans on the double-submit CSRF token.
const AUTH_COOKIE_SAMESITE = String(
  process.env.CORE_AUTH_COOKIE_SAMESITE || (isProduction ? "none" : "lax"),
).toLowerCase();

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction || AUTH_COOKIE_SAMESITE === "none",
  sameSite: AUTH_COOKIE_SAMESITE,
  path: "/",
};

const CSRF_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: isProduction || AUTH_COOKIE_SAMESITE === "none",
  sameSite: AUTH_COOKIE_SAMESITE,
  path: "/",
};

export function issueAuthSessionCookies(res, token) {
  const csrfToken = randomBytes(32).toString("base64url");
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: TOKEN_EXPIRY_MS,
  });
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    ...CSRF_COOKIE_OPTIONS,
    maxAge: TOKEN_EXPIRY_MS,
  });
  return csrfToken;
}

export function clearAuthSessionCookies(res) {
  res.clearCookie(AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS);
  res.clearCookie(CSRF_COOKIE_NAME, CSRF_COOKIE_OPTIONS);
}

export function revokeRequestToken(req) {
  // Only verified, unexpired sessions can add rows; forged cookies cannot fill
  // the revocation table. Keep the original expiry instead of extending it.
  const session = resolveAppAuthSession(req);
  if (!session) return false;
  revocations.revoke(hashToken(session.token), session.issuedAt + TOKEN_EXPIRY_MS);
  return true;
}

export function enforceCsrfProtection(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  const cookies = parseCookies(req);
  const sessionToken = cookies[AUTH_COOKIE_NAME];
  if (!sessionToken) {
    return next();
  }

  const csrfCookie = cookies[CSRF_COOKIE_NAME] || "";
  const csrfHeader = String(req.headers[CSRF_HEADER_NAME] || "");
  if (!csrfCookie || !csrfHeader || !constantTimeEqual(csrfCookie, csrfHeader)) {
    return res.status(403).json({
      error: "Invalid CSRF token",
      code: "csrf_invalid",
    });
  }

  return next();
}

function encodeTokenSegment(value) {
  return Buffer.from(String(value), "utf8").toString("base64url");
}

function decodeTokenSegment(value) {
  return Buffer.from(String(value), "base64url").toString("utf8");
}

function signAuthSessionPayload(encodedPayload) {
  return createHmac("sha256", EFFECTIVE_SECRET)
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
    issuedAt: Date.now(),
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
  const rawToken = getSessionToken(req);
  if (!rawToken) return null;

  // Accept exactly the issued wire format. Ignoring extra segments allowed a
  // revoked token to authenticate under a different hash (token + ".suffix").
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(rawToken)) return null;
  const [encodedPayload, providedSignature] = rawToken.split(".");

  const expectedSignature = signAuthSessionPayload(encodedPayload);
  if (!constantTimeEqual(providedSignature, expectedSignature)) {
    return null;
  }

  // A storage failure must surface as a server error, not a successful logout
  // that only clears cookies while leaving a usable session unrevoked.
  const revoked = revocations.isRevoked(hashToken(rawToken));

  try {
    const payload = JSON.parse(decodeTokenSegment(encodedPayload));
    if (!payload?.userId) {
      return null;
    }

    if (!Number.isSafeInteger(payload.issuedAt) || payload.issuedAt > Date.now() ||
        Date.now() - payload.issuedAt >= TOKEN_EXPIRY_MS) {
      return null;
    }

    if (revoked) {
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
  if (!isConfiguredAdminEmail(auth.user?.email) && auth.user?.role !== "admin") {
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
    res.status(403).json({
      error: "Entity not writable",
      code: "entity_not_writable",
    });
    return false;
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
