export interface SrsInfo {
  /**
   * @isInt
   */
  season: number;
  /**
   * @isInt
   */
  teamId: number;
  team: string;
  conference: string;
  rating: number;
}

export interface AdjustedEfficiencyInfo {
  /**
   * @isInt
   */
  season: number;
  /**
   * @isInt
   */
  teamId: number;
  team: string;
  conference: string;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  rankings: {
    offense: number;
    defense: number;
    net: number;
  };
}

export interface TeamElo {
  /**
   * @isInt
   */
  season: number;
  /**
   * @isInt
   */
  teamId: number;
  team: string;
  conference: string;
  /**
   * @isInt
   */
  elo: number | null;
}

export interface TeamRatingHistory {
  /**
   * @isInt
   */
  season: number;
  /**
   * UTC rating date (YYYY-MM-DD). Includes completed games that tipped off before 10:00 UTC on this date.
   */
  date: string;
  /**
   * @isInt
   */
  teamId: number;
  team: string;
  conference: string;
  /**
   * `published` rows were captured by the daily job.
   * `replay` rows were rebuilt later and may include late results or corrections.
   */
  series: 'published' | 'replay';
  /**
   * Games used in the adjusted efficiency ratings. Zero for SRS-only rows.
   * @isInt
   */
  games: number;
  offensiveRating: number | null;
  defensiveRating: number | null;
  netRating: number | null;
  srs: number | null;
  rankings: {
    /**
     * @isInt
     */
    offense: number | null;
    /**
     * @isInt
     */
    defense: number | null;
    /**
     * @isInt
     */
    net: number | null;
  };
  /**
   * Change in net rating from 1, 7, and 30 days earlier. Null when no earlier snapshot exists.
   */
  netRatingChange: {
    oneDay: number | null;
    sevenDays: number | null;
    thirtyDays: number | null;
  };
}
