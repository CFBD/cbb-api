// Format 1 contract. Keep synchronized with the services writer and website.
export interface TeamDirectory {
  season: number;
  seasonLabel: string; // 2026 -> 2025–26
  teams: DirectoryTeam[]; // stable school, then ID order
  conferences: Conference[]; // name, then ID order
}
export interface Conference {
  id: number;
  name: string;
  abbreviation: string;
}
export interface DirectoryTeam {
  id: number;
  sourceId: string | null;
  school: string;
  mascot: string | null;
  abbreviation: string | null;
  displayName: string | null;
  shortDisplayName: string | null;
  conferenceId: number;
}

export type Availability = 'available' | 'partial' | 'unavailable';
export type Reason =
  | 'no_games'
  | 'no_source_rows'
  | 'incomplete_inputs'
  | 'zero_denominator'
  | 'unclassified_games'
  | 'unclassified_shots';
export interface Coverage {
  state: Availability;
  reason: Reason | null;
  eligibleGames: number;
  coveredGames: number;
}
export interface CountRecord {
  games: number; // eligible finals, including unresolved outcomes
  wins: number;
  losses: number;
  unresolved: number;
}
export interface RatedValue {
  value: number;
  rank: number;
}
export interface AdjustedRatings {
  offense: RatedValue;
  defense: RatedValue;
  net: RatedValue;
  population: number;
}
export interface PollStanding {
  state: 'ranked' | 'unranked' | 'unavailable';
  date: string | null; // YYYY-MM-DD
  week: number | null;
  seasonType: 'regular' | 'postseason' | 'preseason' | null;
  rank: number | null;
}
export interface ShootingLine {
  made: number | null;
  attempted: number | null;
  pct: number | null;
}
export interface SeasonBoxScore {
  fieldGoals: ShootingLine;
  twoPointFieldGoals: ShootingLine;
  threePointFieldGoals: ShootingLine;
  freeThrows: ShootingLine;
  rebounds: {
    offensive: number | null;
    defensive: number | null;
    total: number | null;
  };
  assists: number | null;
  steals: number | null;
  blocks: number | null;
  turnovers: number | null;
  fouls: number | null;
}
export interface TeamBoxScore extends SeasonBoxScore {
  minutes: number | null;
  teamTurnovers: number | null;
  technicalFouls: number | null;
  flagrantFouls: number | null;
  pointsInPaint: number | null;
  pointsOffTurnovers: number | null;
  fastBreakPoints: number | null;
  trueShootingPct: number | null;
}
export interface PlayerSeasonDetails extends SeasonBoxScore {
  starts: number | null;
  assistTurnoverRatio: number | null;
  freeThrowRate: number | null;
  offensiveReboundPct: number | null;
  advanced: {
    games: number;
    offensiveRating: number | null;
    defensiveRating: number | null;
    netRating: number | null;
    porpag: number | null;
    winShares: {
      offensive: number | null;
      defensive: number | null;
      total: number | null;
      per40: number | null;
    };
  };
}
export interface UnitMetrics {
  boxScore?: TeamBoxScore; // Required in format 2.
  points: number | null;
  possessions: number | null;
  rawRating: number | null;
  effectiveFieldGoalPct: number | null;
  turnoverPct: number | null;
  offensiveReboundPct: number | null;
  freeThrowRate: number | null;
}
export interface ShotBucket {
  key: 'at_rim' | 'two_point_jumper' | 'three_point_jumper' | 'unknown';
  attempts: number;
  made: number;
  attemptPct: number | null;
  fieldGoalPct: number | null;
}
export interface ProfilePlayer {
  seasonStats?: PlayerSeasonDetails; // Required in format 2.
  athleteId: number;
  name: string;
  position: string | null;
  onRoster: boolean;
  hasStats: boolean;
  games: number | null;
  minutes: number | null;
  points: number | null;
  rebounds: number | null;
  assists: number | null;
  minutesPerGame: number | null;
  pointsPerGame: number | null;
  usagePct: number | null;
  trueShootingPct: number | null;
  effectiveFieldGoalPct: number | null;
  usageGames: number; // games supporting the usage calculation
  complete: boolean; // required per-player inputs complete for shown rates
}
export interface ProfileGame {
  id: number;
  opponentId: number;
  opponent: string;
  opponentHasProfile: boolean; // season membership, not snapshot existence
  startDate: string; // UTC ISO datetime with Z
  calendarDate: string; // source UTC date, YYYY-MM-DD; use for TBD
  startTimeTbd: boolean;
  location: 'home' | 'away' | 'neutral';
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'cancelled';
  seasonType: 'regular' | 'postseason' | 'preseason';
  gameType: string | null;
  eligibility: 'counted' | 'exhibition' | 'unknown';
  conferenceGame: boolean | null;
  teamPoints: number | null;
  opponentPoints: number | null;
  result: 'W' | 'L' | null;
  venue: string | null;
}
export interface TeamSeasonOverview {
  formatVersion: 1 | 2;
  teamId: number;
  season: number;
  seasonLabel: string;
  generatedAt: string; // UTC ISO timestamp; snapshot read-view time
  team: {
    school: string;
    mascot: string | null;
    sourceId: string | null;
    conference: Conference;
  };
  record: {
    overall: CountRecord;
    conference: CountRecord;
    complete: boolean;
    unknownEligibilityGames: number;
    unknownConferenceGames: number;
  };
  ratings: {
    adjusted: AdjustedRatings | null;
    elo: number | null;
    srs: number | null;
    polls: { ap: PollStanding; coaches: PollStanding };
  };
  efficiency: {
    coverage: Coverage;
    pace: number | null;
    paceGames: number;
    offense: UnitMetrics;
    defense: UnitMetrics;
  };
  shooting: {
    coverage: Coverage;
    trackedAttempts: number;
    buckets: ShotBucket[];
  };
  players: { coverage: Coverage; rows: ProfilePlayer[] };
  schedule: { games: ProfileGame[] }; // full known season, date/ID order
  sources: {
    leaderboardUpdatedAt: string | null;
    latestFinalStartDate: string | null;
    notes: string[]; // bounded, fixed explanatory text; not raw errors
  };
}
