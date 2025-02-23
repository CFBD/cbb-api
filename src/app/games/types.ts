import { GameStatus, SeasonType } from '../enums';

export interface GameInfo {
  /**
   * @isInt
   */
  id: number;
  sourceId: string;
  seasonLabel: string;
  /**
   * @isInt
   */
  season: number;
  seasonType: SeasonType;
  startDate: Date;
  startTimeTbd: boolean;
  neutralSite: boolean;
  conferenceGame: boolean;
  gameType: string | null;
  status: GameStatus;
  /**
   * @isInt
   */
  attendance: number | null;
  /**
   * @isInt
   */
  homeTeamId: number;
  homeTeam: string;
  /**
   * @isInt
   */
  homeConferenceId: number | null;
  homeConference: string | null;
  /**
   * @isInt
   */
  homePoints: number | null;
  /**
   * @isInt
   */
  homePeriodPoints: number[] | null;
  homeWinner: boolean | null;
  /**
   * @isInt
   */
  awayTeamId: number;
  awayTeam: string;
  /**
   * @isInt
   */
  awayConferenceId: number | null;
  awayConference: string | null;
  /**
   * @isInt
   */
  awayPoints: number | null;
  /**
   * @isInt
   */
  awayPeriodPoints: number[] | null;
  awayWinner: boolean | null;
  excitement: number | null;
  /**
   * @isInt
   */
  venueId: number | null;
  venue: string | null;
  city: string | null;
  state: string | null;
}

export interface GameMediaInfo {
  /**
   * @isInt
   */
  gameId: number;
  /**
   * @isInt
   */
  season: number;
  seasonLabel: string;
  seasonType: SeasonType;
  startDate: Date;
  startTimeTbd: boolean;
  /**
   * @isInt
   */
  homeTeamId: number;
  homeTeam: string;
  homeConference: string | null;
  /**
   * @isInt
   */
  awayTeamId: number;
  awayTeam: string;
  awayConference: string | null;
  neutralSite: boolean;
  conferenceGame: boolean;
  gameType: string | null;
  notes: string | null;
  broadcasts: {
    broadcastType: string;
    broadcastName: string;
  }[];
}

export interface GameBoxScoreTeam {
  /**
   * @isInt
   */
  gameId: number;
  /**
   * @isInt
   */
  season: number;
  seasonLabel: string;
  seasonType: SeasonType;
  startDate: Date;
  startTimeTbd: boolean;
  /**
   * @isInt
   */
  teamId: number;
  team: string;
  conference: string | null;
  /**
   * @isInt
   */
  opponentId: number;
  opponent: string;
  opponentConference: string | null;
  neutralSite: boolean;
  conferenceGame: boolean;
  gameType: string | null;
  notes: string | null;
  gameMinutes: number | null;
  pace: number | null;
  teamStats: GameBoxScoreTeamStats;
  opponentStats: GameBoxScoreTeamStats;
}

export interface GameBoxScoreTeamStats {
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
    largestLead: number | null;
    byPeriod: number[] | null;
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
  gameScore: number | null;
}

export interface GameBoxScorePlayers {
  /**
   * @isInt
   */
  gameId: number;
  /**
   * @isInt
   */
  season: number;
  seasonLabel: string;
  seasonType: SeasonType;
  startDate: Date;
  startTimeTbd: boolean;
  /**
   * @isInt
   */
  teamId: number;
  team: string;
  conference: string | null;
  /**
   * @isInt
   */
  opponentId: number;
  opponent: string;
  opponentConference: string | null;
  neutralSite: boolean;
  conferenceGame: boolean;
  gameType: string | null;
  notes: string | null;
  gameMinutes: number | null;
  gamePace: number | null;
  players: {
    /**
     * @isInt
     */
    athleteId: number;
    athleteSourceId: string;
    name: string;
    position: string;
    starter: boolean | null;
    ejected: boolean | null;
    minutes: number | null;
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
    effectiveFieldGoalPct: number | null;
    trueShootingPct: number | null;
    gameScore: number | null;
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
  }[];
}
