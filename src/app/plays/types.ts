import { SeasonType } from '../enums';

export interface PlayTypeInfo {
  /**
   * @isInt
   */
  id: number;
  name: string;
}

export interface PlayInfo {
  /**
   * @isInt
   */
  id: number;
  sourceId: string;
  /**
   * @isInt
   */
  gameId: number;
  gameSourceId: string;
  gameStartDate: Date;
  season: number;
  seasonType: SeasonType;
  gameType: string;
  playType: string;
  isHomeTeam: boolean | null;
  /**
   * @isInt
   */
  teamId: number | null;
  team: string | null;
  conference: string | null;
  /**
   * @isInt
   */
  opponentId: number | null;
  opponent: string | null;
  opponentConference: string | null;
  /**
   * @isInt
   */
  period: number;
  clock: string;
  /**
   * @isInt
   */
  secondsRemaining: number;
  /**
   * @isInt
   */
  homeScore: number;
  /**
   * @isInt
   */
  awayScore: number;
  homeWinProbability: number | null;
  scoringPlay: boolean | null;
  shootingPlay: boolean | null;
  scoreValue: number | null;
  wallclock: Date | null;
  playText: string | null;
  participants: {
    /**
     * @isInt
     */
    id: number;
    name: string;
  }[];
  shotInfo: ShotInfo | null;
}

export interface ShotInfo {
  shooter: {
    /**
     * @isInt
     */
    id: number;
    name: string;
  } | null;
  made: boolean;
  range: 'rim' | 'jumper' | 'three_pointer' | 'free_throw';
  assisted: boolean;
  assistedBy: {
    /**
     * @isInt
     */
    id: number;
    name: string;
  } | null;
}
