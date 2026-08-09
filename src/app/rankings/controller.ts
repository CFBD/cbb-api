import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { getPolls } from './service';
import { SeasonType } from '../enums';

@Route('rankings')
@Middlewares(middlewares.standard)
@Tags('rankings')
export class RankingsController extends Controller {
  /**
   * Returns historical poll rankings.
   * @param season Filters results to the specified season.
   * @param seasonType Filters results to the specified season type.
   * @param week Filters results to the specified week.
   * @param pollType Filters results to the AP or Coaches Poll.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
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
