export interface Recruit {
  /**
   * @isInt
   */
  id: number;
  sourceId: string | null;
  position: string | null;
  /**
   * @isInt
   */
  schoolId: number | null;
  school: string | null;
  hometown: {
    city: string | null;
    state: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    countyFips: string | null;
  } | null;
  committedTo: {
    /**
     * @isInt
     */
    id: number | null;
    name: string | null;
    conference: string | null;
  } | null;
  /**
   * @isInt
   */
  athleteId: number | null;
  /**
   * @isInt
   */
  year: number;
  name: string;
  heightInches: number | null;
  /**
   * @isInt
   */
  weightPounds: number | null;
  /**
   * @isInt
   */
  stars: number;
  rating: number;
  /**
   * @isInt
   */
  ranking: number | null;
}
