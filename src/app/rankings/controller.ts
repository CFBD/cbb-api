import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { getPolls } from './service';
import { SeasonType } from '../enums';

@Route('rankings')
@Middlewares(middlewares.standard)
@Tags('rankings')
export class RankingsController extends Controller {
  /**
   * Retrieves historical poll data
   * @param season Optional season filter
   * @param seasonType Optional season type filter
   * @param week Optional week filter
   * @param pollType Optional poll type filter ("ap" or "coaches")
   * @param team Optional team filter
   * @param conference Optional conference filter
   * @isInt season
   * @isInt week
   */
  @Get()
  public async getRankings(
    @Query() season?: number,
    @Query() seasonType?: SeasonType,
    @Query() week?: number,
    @Query() pollType?: 'ap' | 'coaches',
    @Query() team?: string,
    @Query() conference?: string,
  ) {
    return await getPolls(season, seasonType, week, pollType, team, conference);
  }
}
