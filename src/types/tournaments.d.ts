/** Shared contracts for the existing tournament API and display models.
 * Optional fields reflect legacy imports and the API's slim page projections.
 * Extension fields remain unknown until a consumer narrows them; no implicit any.
 */
export interface Tournament {
  id: string;
  name: string;
  game?: string;
  tier?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  created_date?: string;
  updated_date?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  prize_pool?: string;
  max_teams?: number;
  format_overview?: string;
  rules?: string;
  stages?: TournamentStage[];
  participants?: TournamentParticipant[];
  calendar?: CalendarEntry[];
  prize_breakdown?: PrizeEntry[];
  awards?: Record<string, unknown>[];
  rankings?: Record<string, unknown>[];
  [field: string]: unknown;
}

/** Embedded display stage; distinct from a normalized TournamentStage DB row. */
export interface TournamentStage {
  name: string;
  order?: number;
  status?: string;
  teamCount?: number;
  summary?: string;
  standings?: Standing[];
  [field: string]: unknown;
}

/** Display row produced by stageBoard/stageHelpers, not a raw StageStanding row. */
export interface Standing {
  team: string;
  fullTeam?: string;
  placement?: number;
  matches?: number;
  wwcd?: number;
  pos?: number;
  elimins?: number;
  points?: number;
  grp?: string;
  outcome?: string | null;
  [field: string]: unknown;
}

/** Embedded participant; normalized API records are transformed before display. */
export interface TournamentParticipant {
  team: string;
  phase?: string;
  placement?: number;
  group?: string;
  players?: Array<string | { name?: string; [field: string]: unknown }>;
  [field: string]: unknown;
}

export interface CalendarEntry {
  stage?: string;
  date?: string;
  [field: string]: unknown;
}

export interface PrizeEntry {
  placement?: string | number;
  stage?: string;
  inr?: string | number;
  usd?: string | number;
  cny?: string | number;
  qualifiesTo?: string;
  [field: string]: unknown;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  stage: string;
  group_name?: string;
  match_number?: number;
  map?: string;
  status?: string;
  scheduled_time?: string;
  stream_url?: string;
  day?: number;
  [field: string]: unknown;
}

export interface TournamentResult {
  id: string;
  match_id: string;
  team_id: string;
  tournament_id?: string;
  stage?: string;
  placement?: number;
  kill_points?: number;
  placement_points?: number;
  total_points?: number;
  matches_count?: number;
  wins_count?: number;
  publication_status?: string;
  [field: string]: unknown;
}

export interface TournamentDetailProps {
  tournament: Tournament;
  onBack: () => void;
  requestedStage?: string;
}

export interface TournamentCardProps {
  tournament: Tournament | null;
  logo?: string | null;
  className?: string;
  currentStage?: string | null;
  teamCount?: number | null;
  matchesToday?: number | null;
}
