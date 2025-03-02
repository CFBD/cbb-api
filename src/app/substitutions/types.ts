export interface PlayerSubsititution {
  /**
   * @isInt
   */
  gameId: number;
  startDate: Date;
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
  athlete: string;
  position: string | null;
  /**
   * @isInt
   */
  opponentId: number;
  opponent: string;
  opponentConference: string | null;
  subIn: {
    /**
     * @isInt
     */
    period: number;
    /**
     * @isInt
     */
    secondsRemaining: number;
    /**
     * @isInt
     */
    teamPoints: number;
    /**
     * @isInt
     */
    opponentPoints: number;
  };
  subOut: {
    /**
     * @isInt
     */
    period: number;
    /**
     * @isInt
     */
    secondsRemaining: number;
    /**
     * @isInt
     */
    teamPoints: number;
    /**
     * @isInt
     */
    opponentPoints: number;
  };
}
