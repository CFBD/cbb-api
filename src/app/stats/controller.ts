import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';
import {
  PlayerSeasonShootingStats,
  PlayerSeasonStats,
  SeasonShootingStats,
  TeamSeasonStats,
} from './types';
import {
  getPlayerSeasonShootingStats,
  getPlayerSeasonStats,
  getTeamSeasonShootingStats,
  getTeamSeasonStats,
} from './service';
import { SeasonType } from '../enums';

import middlewares from '../../config/middleware';

@Route('stats')
@Middlewares(middlewares.standard)
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

  /**
   * Retrieves team season shooting statistics
   * @param season Required season filter
   * @param seasonType Optional season type filter
   * @param team Team filter, required if conference is not provided
   * @param conference Conference abbreviation filter, required if team is not provided
   * @param startDateRange Optional start date range filter
   * @param endDateRange Optional end date range filter
   * @isInt season
   */
  @Get('team/shooting/season')
  public async getTeamSeasonShootingStats(
    @Query() season: number,
    @Query() seasonType?: SeasonType,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
  ): Promise<SeasonShootingStats[]> {
    return await getTeamSeasonShootingStats(
      season,
      seasonType,
      team,
      conference,
      startDateRange,
      endDateRange,
    );
  }

  /**
   * Returns player statistics by season
   * @param season Required season filter
   * @param seasonType Optional season type filter
   * @param team Optional team name filter
   * @param conference Optional conference abbreviation filter
   */
  @Get('player/season')
  public async getPlayerSeasonStats(
    @Query() season: number,
    @Query() seasonType?: SeasonType,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
  ): Promise<PlayerSeasonStats[]> {
    return await getPlayerSeasonStats(
      season,
      seasonType,
      team,
      conference,
      startDateRange,
      endDateRange,
    );
  }

  /**
   * Retrieves player season shooting statistics
   * @param season Required season filter
   * @param seasonType Optional season type filter
   * @param team Team filter, required if conference is not provided
   * @param conference Conference abbreviation filter, required if team is not provided
   * @param startDateRange Optional start date range filter
   * @param endDateRange Optional end date range filter
   * @isInt season
   */
  @Get('player/shooting/season')
  public async getPlayerSeasonShootingStats(
    @Query() season: number,
    @Query() seasonType?: SeasonType,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
  ): Promise<PlayerSeasonShootingStats[]> {
    return await getPlayerSeasonShootingStats(
      season,
      seasonType,
      team,
      conference,
      startDateRange,
      endDateRange,
    );
  }
}
