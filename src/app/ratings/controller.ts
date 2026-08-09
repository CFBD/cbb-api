import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { AdjustedEfficiencyInfo, SrsInfo, TeamElo } from './types';
import { getAdjustedEfficiency, getElo, getSrs } from './service';

@Route('ratings')
@Middlewares(middlewares.standard)
@Tags('ratings')
export class RatingsController extends Controller {
  /**
   * Returns Simple Rating System (SRS) ratings.
   * @param season Filters results to the specified season.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
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
   * Returns adjusted offensive and defensive efficiency ratings.
   * @param season Filters results to the specified season.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
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
   * Returns historical Elo ratings.
   * @param season Filters results to the specified season.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
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
