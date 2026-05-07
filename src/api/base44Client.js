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
const TOURNAMENT_JSON_FIELDS = ["stages", "calendar", "prize_breakdown", "awards", "participants", "rankings"];
const RAW_API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

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
    return { ...record, map_rotation: parseMaybeJson(record.map_rotation) || [] };
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

function buildApiUrl(path) {
  const normalizedPath = String(path || "").startsWith("/") ? path : `/${path || ""}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

async function request(path, options = {}) {
  const adminKey = getStoredAdminKey();

  const response = await fetch(buildApiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(adminKey ? { "X-Core-Admin-Key": adminKey } : {}),
      ...(options.headers || {}),
    },
    ...options,
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
    list(sortBy, limit, skip) {
      return request(`${basePath}${toQueryString({ sort_by: sortBy, limit, skip })}`).then((payload) =>
        normalizeEntityResponse(entityName, payload)
      );
    },
    filter(query = {}, sortBy, limit, skip) {
      return request(`${basePath}${toQueryString({ q: JSON.stringify(query), sort_by: sortBy, limit, skip })}`).then((payload) =>
        normalizeEntityResponse(entityName, payload)
      );
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
      return request(`${basePath}/${id}`).then((payload) => normalizeEntityResponse(entityName, payload));
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
  entities: Object.fromEntries(ENTITY_NAMES.map((entityName) => [entityName, createEntityClient(entityName)])),
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
};
