const ENTITY_NAMES = [
  "Tournament",
  "Team",
  "Player",
  "Match",
  "MatchResult",
  "NewsArticle",
  "TransferWindow",
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

async function request(path, options = {}) {
  const { headers: requestHeaders = {}, ...fetchOptions } = options;
  const adminKey = getStoredAdminKey();
  const authSession = getStoredAuthSession();

  const response = await fetch(buildApiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(adminKey ? { "X-Core-Admin-Key": adminKey } : {}),
      ...(authSession.token
        ? { "X-StageCore-Auth-Token": authSession.token }
        : {}),
      ...requestHeaders,
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    const text = await response.text();
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
    list(sortBy, limit, skip, extraQuery = {}) {
      return request(
        `${basePath}${toQueryString({ sort_by: sortBy, limit, skip, ...extraQuery })}`,
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
  pages: {
    tournament(id) {
      return request(`/api/pages/tournament/${encodeURIComponent(id)}`);
    },
    tournamentCore(id) {
      return request(`/api/pages/tournament/${encodeURIComponent(id)}/core`);
    },
    tournamentFull(id) {
      return request(`/api/pages/tournament/${encodeURIComponent(id)}/full`);
    },
    teams() {
      return request("/api/pages/teams");
    },
    teamDetail() {
      return request("/api/pages/team-detail");
    },
    leaderboard(tournamentId = "") {
      return request(
        `/api/pages/leaderboard${toQueryString({ tournament: tournamentId })}`,
      );
    },
    rankings() {
      return request("/api/pages/rankings");
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
  search: {
    global(query, limit = 10) {
      return request(`/api/search${toQueryString({ q: query, limit })}`);
    },
  },
  site: {
    bmps2026PlayerStats() {
      return request("/api/site/bmps-2026-player-stats");
    },
  },
  admin: {
    saveBmps2026PlayerStats(payload) {
      return request("/api/admin/bmps-2026-player-stats", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
  },
  tournaments: {
    normalized(id) {
      return request(`/api/tournaments/${id}/normalized`);
    },
  },
  auth: {
    config() {
      return request("/api/auth/config");
    },
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
};

export { GOOGLE_CLIENT_ID };
