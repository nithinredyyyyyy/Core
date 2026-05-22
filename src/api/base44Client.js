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
  if (entityName === "TransferWindow") {
    return { ...record, players: parseMaybeJson(record.players) || [] };
  }
  if (entityName === "FanPrediction") {
    return { ...record, top_three: parseMaybeJson(record.top_three) || [] };
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

  const response = await fetch(buildApiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(adminKey ? { "X-Core-Admin-Key": adminKey } : {}),
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
  auth: {
    async me() {
      const adminKey = getStoredAdminKey();
      const response = await fetch(buildApiUrl("/api/auth/me"), {
        headers: {
          "Content-Type": "application/json",
          ...(adminKey ? { "X-Core-Admin-Key": adminKey } : {}),
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
    logout() {},
    redirectToLogin() {},
  },
  fan: {
    getStoredSession() {
      return getStoredFanSession();
    },
    clearSession() {
      return clearStoredFanSession();
    },
    async createSession(displayName) {
      const existing = getStoredFanSession();
      const payload = {
        ...(displayName ? { display_name: displayName } : {}),
        ...(existing.userId ? { user_id: existing.userId } : {}),
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
