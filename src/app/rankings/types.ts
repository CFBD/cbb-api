import { SeasonType } from '../enums';

export interface PollTeamInfo {
  /**
   * @isInt
   */
  season: number;
  seasonType: SeasonType;
  /**
   * @isInt
   */
  week: number;
  pollDate: Date | null;
  /**
   * @isInt
   */
  pollType: string;
  teamId: number;
  team: string;
  conference: string | null;
  ranking: number | null;
  points: number | null;
  firstPlaceVotes: number | null;
}
