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

export interface TeamRoster {
  /**
   * @isInt
   */
  teamId: number;
  teamSourceId: string;
  team: string;
  conference: string | null;
  season: number;
  players: TeamRosterPlayer[];
}

export interface TeamRosterPlayer {
  /**
   * @isInt
   */
  id: number;
  sourceId: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  /**
   * @isInt
   */
  jersey: string | null;
  position: string | null;
  height: number | null;
  weight: number | null;
  hometown: {
    city: string | null;
    state: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    countyFips: string | null;
  };
  /**
   * @isDate
   */
  dateOfBirth: Date | null;
  startSeason: number;
  endSeason: number;
}
