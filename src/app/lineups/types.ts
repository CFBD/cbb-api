export interface LineupStats {
  /**
   * @isInt
   */
  teamId: number;
  team: string;
  conference: string;
  idHash: string;
  athletes: {
    /**
     * @isInt
     */
    id: number;
    name: string;
  }[];
  totalSeconds: number;
  pace: number;
  offenseRating: number;
  defenseRating: number;
  netRating: number;
  teamStats: LineupUnitStats;
  opponentStats: LineupUnitStats;
}

interface ShootingStats {
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

interface LineupUnitStats {
  /**
   * @isInt
   */
  possessions: number;
  /**
   * @isInt
   */
  points: number;
  /**
   * @isInt
   */
  blocks: number;
  /**
   * @isInt
   */
  assists: number;
  /**
   * @isInt
   */
  steals: number;
  /**
   * @isInt
   */
  turnovers: number;
  /**
   * @isInt
   */
  defensiveRebounds: number;
  /**
   * @isInt
   */
  offensiveRebounds: number;
  trueShooting: number;
  fieldGoals: ShootingStats;
  twoPointers: ShootingStats & {
    tipIns: ShootingStats;
    dunks: ShootingStats;
    layups: ShootingStats;
    jumpers: ShootingStats;
  };
  threePointers: ShootingStats;
  freeThrows: ShootingStats;
  fourFactors: {
    effectiveFieldGoalPct: number;
    turnoverRatio: number;
    offensiveReboundPct: number;
    freeThrowRate: number;
  };
}
