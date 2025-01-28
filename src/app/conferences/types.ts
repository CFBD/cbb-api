export interface ConferenceInfo {
  /**
   * @isInt
   */
  id: number;
  sourceId: string;
  name: string;
  abbreviation: string;
  shortName: string;
}

export interface ConferenceHistory extends ConferenceInfo {
  teams: {
    /**
     * @isInt
     */
    id: number;
    sourceId: string;
    school: string;
    mascot: string | null;
    /**
     * @isInt
     */
    startSeason: number;
    /**
     * @isInt
     */
    endSeason: number | null;
  }[];
}
