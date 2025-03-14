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
  tournament: string | null;
  playType: string;
  isHomeTeam: boolean | null;
  /**
   * @isInt
   */
  teamId: number | null;
  team: string | null;
  conference: string | null;
  teamSeed: number | null;
  /**
   * @isInt
   */
  opponentId: number | null;
  opponent: string | null;
  opponentConference: string | null;
  opponentSeed: number | null;
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
  onFloor: {
    /**
     * @isInt
     */
    id: number;
    name: string;
    team: string;
  }[];
  shotInfo: ShotInfo | null;
}

export interface ShotInfo {
  shooter: {
    /**
     * @isInt
     */
    id: number | null;
    name: string | null;
  };
  made: boolean;
  range: 'rim' | 'jumper' | 'three_pointer' | 'free_throw';
  assisted: boolean;
  assistedBy: {
    /**
     * @isInt
     */
    id: number | null;
    name: string | null;
  };
  location: {
    x: number | null;
    y: number | null;
  };
}
