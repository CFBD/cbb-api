import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { AdjustedEfficiencyInfo, SrsInfo, TeamElo } from './types';
import { getAdjustedEfficiency, getElo, getSrs } from './service';

@Route('ratings')
@Middlewares(middlewares.standard)
@Tags('ratings')
export class RatingsController extends Controller {
  /**
   * Retrieves SRS ratings for the provided season, team, or conference.
   * @param season Optional season filter
   * @param team Optional team filter
   * @param conference Optional conference abbreviation filter
   * @isInt season
   */
  @Get('srs')
  public async getSrs(
    @Query() season?: number,
    @Query() team?: string,
    @Query() conference?: string,
  ): Promise<SrsInfo[]> {
    return await getSrs(season, team, conference);
  }

  /**
   * Retrieves adjusted efficiency ratings for the provided season, team, or conference.
   * @param season Optional season filter
   * @param team Optional team filter
   * @param conference Optional conference abbreviation filter
   * @isInt season
   */
  @Get('adjusted')
  public async getAdjustedEfficiency(
    @Query() season?: number,
    @Query() team?: string,
    @Query() conference?: string,
  ): Promise<AdjustedEfficiencyInfo[]> {
    return await getAdjustedEfficiency(season, team, conference);
  }

  /**
   * Retrieves historical Elo ratings
   * @param season Optional season filter
   * @param team Optional team filter
   * @param conference Optional conference filter
   * @isInt season
   */
  @Get('elo')
  public async getElo(
    @Query() season?: number,
    @Query() team?: string,
    @Query() conference?: string,
  ): Promise<TeamElo[]> {
    return await getElo(season, team, conference);
  }
}
