export interface TeamSeasonStats {
  /**
   * @isInt
   */
  season: number;
  seasonLabel: string;
  /**
   * @isInt
   */
  teamId: number;
  team: string;
  conference: string | null;
  /**
   * @isInt
   */
  games: number;
  wins: number;
  losses: number;
  totalMinutes: number | null;
  pace: number | null;
  teamStats: TeamSeasonUnitStats;
  opponentStats: TeamSeasonUnitStats;
}

export interface TeamSeasonUnitStats {
  fieldGoals: {
    made: number | null;
    attempted: number | null;
    pct: number | null;
  };
  twoPointFieldGoals: {
    made: number | null;
    attempted: number | null;
    pct: number | null;
  };
  threePointFieldGoals: {
    made: number | null;
    attempted: number | null;
    pct: number | null;
  };
  freeThrows: {
    made: number | null;
    attempted: number | null;
    pct: number | null;
  };
  rebounds: {
    offensive: number | null;
    defensive: number | null;
    total: number | null;
  };
  turnovers: {
    total: number | null;
    teamTotal: number | null;
  };
  fouls: {
    total: number | null;
    technical: number | null;
    flagrant: number | null;
  };
  points: {
    total: number | null;
    inPaint: number | null;
    offTurnovers: number | null;
    fastBreak: number | null;
  };
  fourFactors: {
    effectiveFieldGoalPct: number | null;
    turnoverRatio: number | null;
    offensiveReboundPct: number | null;
    freeThrowRate: number | null;
  };
  assists: number | null;
  blocks: number | null;
  steals: number | null;
  possessions: number | null;
  rating: number | null;
  trueShooting: number | null;
}

export interface PlayerSeasonStats {
  /**
   * @isInt
   */
  season: number;
  seasonLabel: string;
  /**
   * @isInt
   */
  teamId: number;
  team: string;
  conference: string | null;
  /**
   * @isInt
   */
  athleteId: number;
  athleteSourceId: string;
  name: string;
  position: string;
  games: number;
  starts: number;
  minutes: number;
  points: number | null;
  turnovers: number | null;
  fouls: number | null;
  assists: number | null;
  steals: number | null;
  blocks: number | null;
  usage: number | null;
  offensiveRating: number | null;
  defensiveRating: number | null;
  netRating: number | null;
  PORPAG: number | null;
  effectiveFieldGoalPct: number | null;
  trueShootingPct: number | null;
  assistsTurnoverRatio: number | null;
  freeThrowRate: number | null;
  offensiveReboundPct: number | null;
  fieldGoals: {
    made: number | null;
    attempted: number | null;
    pct: number | null;
  };
  twoPointFieldGoals: {
    made: number | null;
    attempted: number | null;
    pct: number | null;
  };
  threePointFieldGoals: {
    made: number | null;
    attempted: number | null;
    pct: number | null;
  };
  freeThrows: {
    made: number | null;
    attempted: number | null;
    pct: number | null;
  };
  rebounds: {
    offensive: number | null;
    defensive: number | null;
    total: number | null;
  };
  winShares: {
    offensive: number | null;
    defensive: number | null;
    total: number | null;
    totalPer40: number | null;
  };
}

export interface ShotTypeBreakdown {
  /**
   * @isInt
   */
  made: number;
  /**
   * @isInt
   */
  attempted: number;
  pct: number;
}

export interface SeasonShootingStats {
  /**
   * @isInt
   */
  season: number;
  /**
   * @isInt
   */
  teamId: number;
  team: string;
  conference: string | null;
  /**
   * @isInt
   */
  trackedShots: number;
  assistedPct: number;
  freeThrowRate: number;
  dunks: ShotTypeBreakdown & {
    /**
     * @isInt
     */
    assisted: number;
    assistedPct: number;
  };
  layups: ShotTypeBreakdown & {
    /**
     * @isInt
     */
    assisted: number;
    assistedPct: number;
  };
  tipIns: ShotTypeBreakdown;
  twoPointJumpers: ShotTypeBreakdown & {
    /**
     * @isInt
     */
    assisted: number;
    assistedPct: number;
  };
  threePointJumpers: ShotTypeBreakdown & {
    /**
     * @isInt
     */
    assisted: number;
    assistedPct: number;
  };
  freeThrows: ShotTypeBreakdown;
  attemptsBreakdown: {
    dunks: number;
    layups: number;
    tipIns: number;
    twoPointJumpers: number;
    threePointJumpers: number;
  };
}

export interface PlayerSeasonShootingStats extends SeasonShootingStats {
  /**
   * @isInt
   */
  athleteId: number;
  athleteName: string;
}

export interface TeamLeaderboardAdjustedEfficiency {
  offensiveRating: number | null;
  defensiveRating: number | null;
  netRating: number | null;
  rankings: {
    offense: number | null;
    defense: number | null;
    net: number | null;
  };
}

export interface TeamStatsLeaderboardConference {
  id: number | null;
  abbreviation: string | null;
}

export interface TeamStatsLeaderboardRecordSummary {
  games: number;
  wins: number;
  losses: number;
}

export interface TeamStatsLeaderboardSummary {
  totalMinutes: number;
  trackedShots: number;
  pace: number | null;
  rawNetRating: number | null;
}

export interface TeamStatsLeaderboardUnitStats {
  points: {
    total: number;
    inPaint: number;
    offTurnovers: number;
    fastBreak: number;
  };
  possessions: number;
  rawOffensiveRating: number | null;
  trueShootingPct: number | null;
  effectiveFieldGoalPct: number | null;
  turnoverRatio: number | null;
  offensiveReboundPct: number | null;
  freeThrowRate: number | null;
  fieldGoals: {
    made: number;
    attempted: number;
  };
  twoPointFieldGoals: {
    made: number;
    attempted: number;
  };
  threePointFieldGoals: {
    made: number;
    attempted: number;
  };
  freeThrows: {
    made: number;
    attempted: number;
  };
  rebounds: {
    offensive: number;
    defensive: number;
    total: number;
  };
  turnovers: {
    total: number;
    team: number;
    technical: number;
  };
  fouls: {
    total: number;
    technical: number;
    flagrant: number;
  };
  assists: number;
  blocks: number;
  steals: number;
}

export interface TeamStatsLeaderboardShotProfile {
  assistedPct: number;
  atRim: {
    rate: number | null;
    pct: number | null;
    assistedPct: number | null;
  };
  dunk: {
    attempts: number;
    made: number;
    assisted: number;
    rate: number | null;
  };
  layup: {
    attempts: number;
    made: number;
    assisted: number;
    rate: number | null;
  };
  tipIn: {
    attempts: number;
    made: number;
    rate: number | null;
  };
  twoPointJumper: {
    attempts: number;
    made: number;
    assisted: number;
    rate: number | null;
    pct: number | null;
    assistedPct: number | null;
  };
  threePointJumper: {
    attempts: number;
    made: number;
    assisted: number;
    rate: number | null;
    pct: number | null;
    assistedPct: number | null;
  };
  freeThrows: {
    attempts: number;
    made: number;
    rate: number;
  };
  distribution: {
    midrangeRate: number | null;
    jumperRate: number | null;
    threeRate: number | null;
  };
}

export interface TeamStatsLeaderboardRecord {
  /**
   * @isInt
   */
  season: number;
  /**
   * @isInt
   */
  teamId: number;
  team: string;
  conference: TeamStatsLeaderboardConference;
  record: TeamStatsLeaderboardRecordSummary;
  summary: TeamStatsLeaderboardSummary;
  teamStats: TeamStatsLeaderboardUnitStats;
  opponentStats: TeamStatsLeaderboardUnitStats;
  shotProfile: TeamStatsLeaderboardShotProfile;
  adjustedEfficiency: TeamLeaderboardAdjustedEfficiency | null;
}
