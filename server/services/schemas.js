import { z } from "zod";

export function splitTrimmedValues(rawValue) {
  return String(rawValue || "")
    .split(",")
    .flatMap((value) => {
      const normalized = value.trim();
      return normalized ? [normalized] : [];
    });
}

const stringField = (min = 1) => z.string().trim().min(min);
const numberField = () => z.number().finite();
const intField = () => z.number().int();

const createSchemas = {
  Tournament: z.object({
    name: stringField(),
    game: stringField(),
    tier: z.string().optional(),
    status: z.string().optional(),
    prize_pool: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    stages: z.array(z.any()).optional(),
    description: z.string().optional(),
    banner_url: z.string().optional(),
    rules: z.string().optional(),
    max_teams: intField().optional(),
    format_overview: z.string().optional(),
    calendar: z.array(z.any()).optional(),
    prize_breakdown: z.array(z.any()).optional(),
    awards: z.array(z.any()).optional(),
    participants: z.array(z.any()).optional(),
    rankings: z.array(z.any()).optional(),
    created_by: z.string().optional(),
  }),
  Team: z.object({
    name: stringField(),
    tag: stringField(),
    logo_url: z.string().optional(),
    game: z.string().optional(),
    region: z.string().optional(),
    total_kills: intField().optional(),
    total_points: intField().optional(),
    matches_played: intField().optional(),
    wins: intField().optional(),
    created_by: z.string().optional(),
  }),
  Player: z.object({
    ign: stringField(),
    real_name: z.string().optional(),
    team_id: z.string().optional(),
    role: z.string().optional(),
    photo_url: z.string().optional(),
    total_kills: intField().optional(),
    matches_played: intField().optional(),
    avg_damage: numberField().optional(),
    created_by: z.string().optional(),
  }),
  Match: z.object({
    tournament_id: stringField(),
    stage: stringField(),
    group_name: z.string().optional(),
    match_number: intField().optional(),
    map: z.string().optional(),
    status: z.string().optional(),
    scheduled_time: z.string().optional(),
    stream_url: z.string().optional(),
    day: intField().optional(),
    created_by: z.string().optional(),
  }),
  MatchResult: z.object({
    match_id: stringField(),
    tournament_id: z.string().optional(),
    team_id: stringField(),
    placement: intField().optional(),
    kill_points: intField().optional(),
    placement_points: intField().optional(),
    total_points: intField().optional(),
    matches_count: intField().optional(),
    wins_count: intField().optional(),
    stage: z.string().optional(),
    publication_status: z.string().optional(),
    created_by: z.string().optional(),
  }),
  NewsArticle: z.object({
    title: stringField(),
    summary: z.string().optional(),
    ai_summary: z.string().optional(),
    content: stringField(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    thumbnail_url: z.string().optional(),
    featured: z.number().int().min(0).max(1).optional(),
    game: z.string().optional(),
    source_name: z.string().optional(),
    source_url: z.string().optional(),
    source_type: z.string().optional(),
    verification_status: z.string().optional(),
    publication_status: z.string().optional(),
    priority: z.string().optional(),
    is_auto_ingested: z.number().int().min(0).max(1).optional(),
    import_hash: z.string().optional(),
    created_date: z.string().optional(),
    created_by: z.string().optional(),
  }),
  TransferWindow: z.object({
    window: stringField(),
    date: z.string().optional(),
    country: z.string().optional(),
    players: z.array(z.any()).optional(),
    oldTeam: z.string().optional(),
    newTeam: z.string().optional(),
    created_by: z.string().optional(),
  }),
  TeamAlias: z.object({
    team_id: stringField(),
    alias: stringField(),
    normalized_alias: stringField(),
    alias_type: z.string().optional(),
  }),
  PlayerAlias: z.object({
    player_id: stringField(),
    alias: stringField(),
    normalized_alias: stringField(),
  }),
  PlayerTeamHistory: z.object({
    player_id: stringField(),
    team_id: stringField(),
    joined_date: z.string().optional(),
    left_date: z.string().optional(),
    role: z.string().optional(),
    source: z.string().optional(),
  }),
  TournamentStage: z.object({
    tournament_id: stringField(),
    name: stringField(),
    slug: stringField(),
    stage_order: intField(),
    stage_type: z.string().optional(),
    status: z.string().optional(),
    summary: z.string().optional(),
    rules: z.string().optional(),
    map_rotation: z.array(z.any()).optional(),
  }),
  TournamentStageGroup: z.object({
    stage_id: stringField(),
    group_name: stringField(),
    group_order: intField(),
  }),
  TournamentParticipant: z.object({
    tournament_id: stringField(),
    team_id: stringField(),
    seed: intField().optional(),
    invite_status: z.string().optional(),
    start_stage_id: z.string().optional(),
    final_stage_id: z.string().optional(),
    final_rank: intField().optional(),
    prize_amount: z.string().optional(),
  }),
  TournamentParticipantStageEntry: z.object({
    participant_id: stringField(),
    stage_id: stringField(),
    group_id: z.string().optional(),
    phase_label: z.string().optional(),
    placement: intField().optional(),
    qualified: z.number().int().min(0).max(1).optional(),
    eliminated: z.number().int().min(0).max(1).optional(),
    notes: z.string().optional(),
  }),
  TournamentParticipantPlayer: z.object({
    participant_id: stringField(),
    player_id: z.string().optional(),
    player_name: stringField(),
    country: z.string().optional(),
    role: z.string().optional(),
    is_captain: z.number().int().min(0).max(1).optional(),
    is_substitute: z.number().int().min(0).max(1).optional(),
  }),
  StageStanding: z.object({
    tournament_id: stringField(),
    stage_id: stringField(),
    group_id: z.string().optional(),
    team_id: stringField(),
    rank: intField().optional(),
    matches_played: intField().optional(),
    wins: intField().optional(),
    place_points: intField().optional(),
    elim_points: intField().optional(),
    total_points: intField().optional(),
    progression_status: z.string().optional(),
  }),
  StageMatchBreakdown: z.object({
    standing_id: stringField(),
    match_id: stringField(),
    placement: intField().optional(),
    kills: intField().optional(),
    total_points: intField().optional(),
  }),
};

const updateSchemas = Object.fromEntries(
  Object.entries(createSchemas).map(([entity, schema]) => [
    entity,
    schema.partial(),
  ]),
);

export function validateEntityPayload(entityName, payload, mode = "create") {
  const schema =
    mode === "update" ? updateSchemas[entityName] : createSchemas[entityName];
  if (!schema) return payload || {};
  return schema.parse(payload || {});
}
