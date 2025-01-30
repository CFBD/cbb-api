import { SeasonType } from '../enums';

export interface LineProviderInfo {
  /**
   * @isInt
   */
  id: number;
  name: string;
}

export interface GameLineInfo {
  provider: string;
  spread: number | null;
  overUnder: number | null;
  homeMoneyline: number | null;
  awayMoneyline: number | null;
  spreadOpen: number | null;
  overUnderOpen: number | null;
}

export interface GameLines {
  /**
   * @isInt
   */
  gameId: number;
  /**
   * @isInt
   */
  season: number;
  seasonType: SeasonType;
  startDate: Date;
  /**
   * @isInt
   */
  homeTeamId: number;
  homeTeam: string;
  homeConference: string | null;
  homeScore: number | null;
  /**
   * @isInt
   */
  awayTeamId: number;
  awayTeam: string;
  awayConference: string | null;
  awayScore: number | null;
  lines: GameLineInfo[];
}
