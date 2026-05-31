const ENTITY_NAMES = [
  "Tournament",
  "Team",
  "Player",
  "Match",
  "MatchResult",
  "NewsArticle",
  "TransferWindow",
  "FanProfile",
  "FanPrediction",
  "FanPollVote",
  "FanChatMessage",
  "FanFollowItem",
  "SavedMatch",
  "FantasySquad",
  "FanCommentReaction",
  "TeamAlias",
  "PlayerAlias",
  "PlayerTeamHistory",
  "TournamentStage",
  "TournamentStageGroup",
  "TournamentParticipant",
  "TournamentParticipantStageEntry",
  "TournamentParticipantPlayer",
  "StageStanding",
  "StageMatchBreakdown",
];
const TOURNAMENT_JSON_FIELDS = [
  "stages",
  "calendar",
  "prize_breakdown",
  "awards",
  "participants",
  "rankings",
];
const SAFE_IMPORT_META_ENV =
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
const RAW_API_BASE_URL = String(
  SAFE_IMPORT_META_ENV.VITE_API_BASE_URL || "",
).trim();
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");
const FILE_PROTOCOL_API_BASE_URL = "http://127.0.0.1:4000";
const FAN_USER_ID_KEY = "stagecore_fan_user_id";
const FAN_USER_NAME_KEY = "stagecore_fan_user_name";
const FAN_TOKEN_KEY = "stagecore_fan_token";
const AUTH_USER_ID_KEY = "stagecore_auth_user_id";
const AUTH_USER_EMAIL_KEY = "stagecore_auth_user_email";
const AUTH_USER_NAME_KEY = "stagecore_auth_user_name";
const AUTH_USER_ROLE_KEY = "stagecore_auth_user_role";
const AUTH_USER_METHOD_KEY = "stagecore_auth_user_method";
const AUTH_TOKEN_KEY = "stagecore_auth_token";
const GOOGLE_CLIENT_ID = String(
  SAFE_IMPORT_META_ENV.VITE_GOOGLE_CLIENT_ID || "",
).trim();

function parseMaybeJson(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeEntityRecord(entityName, record) {
  if (!record || typeof record !== "object") return record;
  if (entityName === "NewsArticle") {
    return {
      ...record,
      tags: parseMaybeJson(record.tags) || [],
    };
  }
  if (entityName === "TransferWindow") {
    return { ...record, players: parseMaybeJson(record.players) || [] };
  }
  if (entityName === "FanProfile") {
    return {
      ...record,
      badge_inventory: parseMaybeJson(record.badge_inventory) || [],
    };
  }
  if (entityName === "FanPrediction") {
    return { ...record, top_three: parseMaybeJson(record.top_three) || [] };
  }
  if (entityName === "FantasySquad") {
    return { ...record, picks: parseMaybeJson(record.picks) || [] };
  }
  if (entityName === "TournamentStage") {
    return {
      ...record,
      map_rotation: parseMaybeJson(record.map_rotation) || [],
    };
  }
  if (entityName !== "Tournament") return record;

  const normalized = { ...record };
  for (const field of TOURNAMENT_JSON_FIELDS) {
    normalized[field] = parseMaybeJson(normalized[field]);
  }
  return normalized;
}

function normalizeEntityResponse(entityName, payload) {
  if (Array.isArray(payload)) {
    return payload.map((record) => normalizeEntityRecord(entityName, record));
  }
  return normalizeEntityRecord(entityName, payload);
}

function getStoredAdminKey() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem("core_admin_key") || "";
  } catch {
    return "";
  }
}

function getStoredFanSession() {
  if (typeof window === "undefined") {
    return { userId: "", displayName: "", token: "" };
  }

  try {
    return {
      userId: window.localStorage.getItem(FAN_USER_ID_KEY) || "",
      displayName: window.localStorage.getItem(FAN_USER_NAME_KEY) || "",
      token: window.localStorage.getItem(FAN_TOKEN_KEY) || "",
    };
  } catch {
    return { userId: "", displayName: "", token: "" };
  }
}

function getStoredAuthSession() {
  if (typeof window === "undefined") {
    return {
      user: null,
      token: "",
    };
  }

  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
    const id = window.localStorage.getItem(AUTH_USER_ID_KEY) || "";
    const email = window.localStorage.getItem(AUTH_USER_EMAIL_KEY) || "";
    const fullName = window.localStorage.getItem(AUTH_USER_NAME_KEY) || "";
    const role = window.localStorage.getItem(AUTH_USER_ROLE_KEY) || "";
    const authMethod = window.localStorage.getItem(AUTH_USER_METHOD_KEY) || "";

    return {
      token,
      user: token
        ? {
            id,
            email,
            full_name: fullName,
            role,
            auth_method: authMethod,
          }
        : null,
    };
  } catch {
    return {
      user: null,
      token: "",
    };
  }
}

function clearStoredFanSession() {
  if (typeof window === "undefined") {
    return { userId: "", displayName: "", token: "" };
  }

  try {
    window.localStorage.removeItem(FAN_USER_ID_KEY);
    window.localStorage.removeItem(FAN_TOKEN_KEY);
  } catch {
    // Ignore localStorage cleanup errors.
  }

  return {
    userId: "",
    displayName: window.localStorage.getItem(FAN_USER_NAME_KEY) || "",
    token: "",
  };
}

function clearStoredAuthSession() {
  if (typeof window === "undefined") {
    return { user: null, token: "" };
  }

  try {
    window.localStorage.removeItem(AUTH_USER_ID_KEY);
    window.localStorage.removeItem(AUTH_USER_EMAIL_KEY);
    window.localStorage.removeItem(AUTH_USER_NAME_KEY);
    window.localStorage.removeItem(AUTH_USER_ROLE_KEY);
    window.localStorage.removeItem(AUTH_USER_METHOD_KEY);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignore localStorage cleanup errors.
  }

  return { user: null, token: "" };
}

function persistFanSession(session) {
  if (typeof window === "undefined") return session;

  try {
    window.localStorage.setItem(FAN_USER_ID_KEY, session.userId || "");
    window.localStorage.setItem(FAN_USER_NAME_KEY, session.displayName || "");
    window.localStorage.setItem(FAN_TOKEN_KEY, session.token || "");
  } catch {
    // Ignore localStorage write errors and still return the in-memory session.
  }

  return session;
}

function persistAuthSession(session) {
  if (typeof window === "undefined") return session;

  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, session?.token || "");
    window.localStorage.setItem(AUTH_USER_ID_KEY, session?.user?.id || "");
    window.localStorage.setItem(AUTH_USER_EMAIL_KEY, session?.user?.email || "");
    window.localStorage.setItem(
      AUTH_USER_NAME_KEY,
      session?.user?.full_name || "",
    );
    window.localStorage.setItem(AUTH_USER_ROLE_KEY, session?.user?.role || "");
    window.localStorage.setItem(
      AUTH_USER_METHOD_KEY,
      session?.user?.auth_method || "",
    );
  } catch {
    // Ignore localStorage write errors and still return the in-memory session.
  }

  return session;
}

function buildApiUrl(path) {
  const normalizedPath = String(path || "").startsWith("/")
    ? path
    : `/${path || ""}`;
  if (API_BASE_URL) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  if (typeof window !== "undefined" && window.location?.protocol === "file:") {
    return `${FILE_PROTOCOL_API_BASE_URL}${normalizedPath}`;
  }

  return normalizedPath;
}

async function refreshFanSession(displayName, userId) {
  const adminKey = getStoredAdminKey();
  const response = await fetch(buildApiUrl("/api/fan/session"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(adminKey ? { "X-Core-Admin-Key": adminKey } : {}),
    },
    body: JSON.stringify({
      ...(displayName ? { display_name: displayName } : {}),
      ...(userId ? { user_id: userId } : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  const session = await response.json();
  return persistFanSession(session);
}

async function request(path, options = {}) {
  const {
    __fanSessionRetry = false,
    headers: requestHeaders = {},
    ...fetchOptions
  } = options;
  const adminKey = getStoredAdminKey();
  const fanSession = getStoredFanSession();
  const authSession = getStoredAuthSession();

  const response = await fetch(buildApiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(adminKey ? { "X-Core-Admin-Key": adminKey } : {}),
      ...(authSession.token
        ? { "X-StageCore-Auth-Token": authSession.token }
        : {}),
      ...(fanSession.token
        ? { "X-StageCore-Fan-Token": fanSession.token }
        : {}),
      ...requestHeaders,
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    const text = await response.text();
    let parsedError = null;
    try {
      parsedError = JSON.parse(text);
    } catch {
      parsedError = null;
    }

    if (
      response.status === 401 &&
      parsedError?.code === "fan_session_required" &&
      !__fanSessionRetry
    ) {
      const previousSession = getStoredFanSession();
      clearStoredFanSession();
      if (previousSession.displayName || previousSession.userId) {
        await refreshFanSession(
          previousSession.displayName,
          previousSession.userId,
        );
        return request(path, { ...options, __fanSessionRetry: true });
      }
    }

    throw new Error(text || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function toQueryString(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function createEntityClient(entityName) {
  const basePath = `/api/entities/${entityName}`;

  return {
    list(sortBy, limit, skip) {
      return request(
        `${basePath}${toQueryString({ sort_by: sortBy, limit, skip })}`,
      ).then((payload) => normalizeEntityResponse(entityName, payload));
    },
    filter(query = {}, sortBy, limit, skip) {
      return request(
        `${basePath}${toQueryString({ q: JSON.stringify(query), sort_by: sortBy, limit, skip })}`,
      ).then((payload) => normalizeEntityResponse(entityName, payload));
    },
    create(data) {
      return request(basePath, {
        method: "POST",
        body: JSON.stringify(data),
      }).then((payload) => normalizeEntityResponse(entityName, payload));
    },
    bulkCreate(data) {
      return request(`${basePath}/bulk`, {
        method: "POST",
        body: JSON.stringify(data),
      }).then((payload) => normalizeEntityResponse(entityName, payload));
    },
    get(id) {
      return request(`${basePath}/${id}`).then((payload) =>
        normalizeEntityResponse(entityName, payload),
      );
    },
    update(id, data) {
      return request(`${basePath}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }).then((payload) => normalizeEntityResponse(entityName, payload));
    },
    delete(id) {
      return request(`${basePath}/${id}`, { method: "DELETE" });
    },
    deleteMany() {
      throw new Error("deleteMany is not implemented for the custom API yet.");
    },
    restore(id) {
      return this.get(id);
    },
  };
}

export const base44 = {
  entities: Object.fromEntries(
    ENTITY_NAMES.map((entityName) => [
      entityName,
      createEntityClient(entityName),
    ]),
  ),
  home: {
    summary() {
      return request("/api/home/summary");
    },
    view(mode = "desktop") {
      return request(`/api/home/view${toQueryString({ mode })}`);
    },
  },
  news: {
    listPublished(sortBy = "-created_date", limit = 50, skip) {
      return request(
        `/api/news/public${toQueryString({ sort_by: sortBy, limit, skip })}`,
      ).then((payload) => normalizeEntityResponse("NewsArticle", payload));
    },
    getPublished(id) {
      return request(`/api/news/public/${id}`).then((payload) =>
        normalizeEntityResponse("NewsArticle", payload),
      );
    },
    adminSources() {
      return request("/api/admin/news/sources");
    },
    importFromSources(payload = {}) {
      return request("/api/admin/news/import", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    backfillImportedMetadata() {
      return request("/api/admin/news/backfill", {
        method: "POST",
      });
    },
  },
  retention: {
    follow(type, targetId, targetLabel, session) {
      return request("/api/entities/FanFollowItem", {
        method: "POST",
        body: JSON.stringify({
          user_id: session.userId,
          display_name: session.displayName,
          target_type: type,
          target_id: targetId,
          target_label: targetLabel,
        }),
      }).then((payload) => normalizeEntityResponse("FanFollowItem", payload));
    },
  },
  search: {
    global(query, limit = 10) {
      return request(`/api/search${toQueryString({ q: query, limit })}`);
    },
  },
  tournaments: {
    normalized(id) {
      return request(`/api/tournaments/${id}/normalized`);
    },
  },
  streamExtraction: {
    health() {
      return request("/api/stream-extraction/health");
    },
    listSessions(status) {
      return request(
        `/api/stream-extraction/sessions${toQueryString({ status })}`,
      );
    },
    createSession(payload) {
      return request("/api/stream-extraction/sessions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    updateSession(id, payload) {
      return request(`/api/stream-extraction/sessions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    runWorkerOnce() {
      return request("/api/stream-extraction/worker/run-once", {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    listFrameJobs(sessionId) {
      return request(`/api/stream-extraction/sessions/${sessionId}/frame-jobs`);
    },
    listOcrResults(sessionId) {
      return request(`/api/stream-extraction/sessions/${sessionId}/results`);
    },
    listMatchStats(sessionId, matchKey) {
      return request(
        `/api/stream-extraction/sessions/${sessionId}/match-stats${toQueryString({ match_key: matchKey })}`,
      );
    },
    aggregateMatchStats(payload) {
      return request("/api/stream-extraction/match-stats/aggregate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },
  auth: {
    getStoredSession() {
      return getStoredAuthSession();
    },
    clearSession() {
      return clearStoredAuthSession();
    },
    async me() {
      const adminKey = getStoredAdminKey();
      const authSession = getStoredAuthSession();
      const response = await fetch(buildApiUrl("/api/auth/me"), {
        headers: {
          "Content-Type": "application/json",
          ...(adminKey ? { "X-Core-Admin-Key": adminKey } : {}),
          ...(authSession.token
            ? { "X-StageCore-Auth-Token": authSession.token }
            : {}),
        },
      });

      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed with ${response.status}`);
      }

      return response.json();
    },
    async signInWithGoogle(credential) {
      const session = await request("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      });
      return persistAuthSession(session);
    },
    logout() {
      clearStoredAuthSession();
    },
    redirectToLogin() {},
  },
  fan: {
    getStoredSession() {
      return getStoredFanSession();
    },
    clearSession() {
      return clearStoredFanSession();
    },
    async createSession(displayName, preferredUserId) {
      const existing = getStoredFanSession();
      const payload = {
        ...(displayName ? { display_name: displayName } : {}),
        ...(preferredUserId
          ? { user_id: preferredUserId }
          : existing.userId
            ? { user_id: existing.userId }
            : {}),
      };
      const session = await request("/api/fan/session", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return persistFanSession(session);
    },
    async ensureSession(displayName) {
      const existing = getStoredFanSession();
      if (existing.userId && existing.displayName && existing.token) {
        return existing;
      }
      return this.createSession(displayName || existing.displayName);
    },
  },
};

export { GOOGLE_CLIENT_ID };
