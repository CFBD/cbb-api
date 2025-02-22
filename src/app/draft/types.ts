export interface DraftPosition {
  name: string;
  abbreviation: string;
}

export interface DraftTeam {
  /**
   * @isInt
   */
  id: number;
  sourceId: number;
  location: string;
  name: string;
  displayName: string;
  abbreviation: string;
}

export interface DraftPick {
  /**
   * @isInt
   */
  athleteId: number | null;
  /**
   * @isInt
   */
  sourceTeamId: number | null;
  sourceTeamLocation: string | null;
  sourceTeamName: string | null;
  sourceTeamLeagueAffiliation: string | null;
  sourceTeamCollegeId: number | null;
  draftTeamId: number;
  draftTeam: string;
  /**
   * @isInt
   */
  year: number;
  /**
   * @isInt
   */
  overall: number;
  /**
   * @isInt
   */
  round: number;
  /**
   * @isInt
   */
  pick: number;
  name: string;
  /**
   * @isInt
   */
  overallRank: number | null;
  /**
   * @isInt
   */
  positionRank: number | null;
  /**
   * @isInt
   */
  height: number | null;
  /**
   * @isInt
   */
  weight: number | null;
}
