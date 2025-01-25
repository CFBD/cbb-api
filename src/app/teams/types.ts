export interface TeamInfo {
  /**
   * @isInt
   */
  id: number;
  sourceId: string;
  school: string;
  mascot: string | null;
  abbreviation: string | null;
  displayName: string | null;
  shortDisplayName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  /**
   * @isInt
   */
  currentVenueId: number | null;
  currentVenue: string | null;
  currentCity: string | null;
  currentState: string | null;
  /**
   * @isInt
   */
  conferenceId: number | null;
  conference: string | null;
}
