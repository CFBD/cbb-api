import { Route, Tags, Controller, Get, Query } from 'tsoa';
import { TeamSeasonStats } from './types';
import { getTeamSeasonStats } from './service';
import { SeasonType } from '../enums';

@Route('stats')
@Tags('stats')
export class StatsController extends Controller {
  /**
   * Returns team season statistics by year or team
   * @param season Optional season filter, required if team is not provided
   * @param seasonType Optional season type filter
   * @param team Optional team name filter, required if season is not provided
   * @param conference Optional conference abbreviation filter
   */
  @Get('team/season')
  public async getTeamSeasonStats(
    @Query() season?: number,
    @Query() seasonType?: SeasonType,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
  ): Promise<TeamSeasonStats[]> {
    return await getTeamSeasonStats(
      season,
      seasonType,
      team,
      conference,
      startDateRange,
      endDateRange,
    );
  }
}
