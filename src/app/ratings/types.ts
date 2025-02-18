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
