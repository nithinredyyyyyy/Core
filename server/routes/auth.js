import { sendRequestError } from "../services/requestErrors.js";
import { Router } from "express";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import {
  clearAuthSessionCookies,
  createAuthSession,
  GOOGLE_CLIENT_ID,
  isConfiguredAdminEmail,
  issueAuthSessionCookies,
  resolveRequestAuth,
  revokeRequestToken,
} from "../services/auth.js";

export const authRouter = Router();

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

authRouter.get("/auth/me", (req, res) => {
  const auth = resolveRequestAuth(req);
  if (!auth.isAuthenticated) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json(auth.user);
});

authRouter.get("/auth/config", (req, res) => {
  return res.json({
    googleClientId: GOOGLE_CLIENT_ID || null,
    googleEnabled: Boolean(GOOGLE_CLIENT_ID),
  });
});

authRouter.post("/auth/google", async (req, res) => {
  const payloadSchema = z.object({
    credential: z.string().min(1),
  });

  try {
    const payload = payloadSchema.parse(req.body || {});

    if (!GOOGLE_CLIENT_ID || !googleClient) {
      return res.status(500).json({
        error: "Google sign-in is not configured",
        code: "google_signin_not_configured",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: payload.credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const googleProfile = ticket.getPayload();

    if (!googleProfile) {
      return res.status(401).json({
        error: "Invalid Google credential",
        code: "google_signin_invalid_token",
      });
    }

    if (
      googleProfile.email_verified !== true
    ) {
      return res.status(401).json({
        error: "Google email not verified",
        code: "google_signin_email_not_verified",
      });
    }

    const session = createAuthSession({
      id: `google:${String(googleProfile.sub || "").trim()}`,
      email: googleProfile.email,
      full_name:
        googleProfile.name ||
        googleProfile.given_name ||
        String(googleProfile.email || "").split("@")[0] ||
        "StageCore User",
      role: isConfiguredAdminEmail(googleProfile.email) ? "admin" : "member",
      auth_method: "google",
    });

    const csrfToken = issueAuthSessionCookies(res, session.token);

    return res.status(201).json({ user: session.user, csrfToken });
  } catch (error) {
    return sendRequestError(req, res, error, 500);
  }
});

authRouter.post("/auth/logout", (req, res) => {
  revokeRequestToken(req);
  clearAuthSessionCookies(res);
  return res.status(204).end();
});
