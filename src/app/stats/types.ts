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
  totalMinutes: number | null;
  pace: number | null;
  offense: TeamSeasonUnitStats;
  defense: TeamSeasonUnitStats;
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
