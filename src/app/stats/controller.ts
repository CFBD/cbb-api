import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';
import {
  PlayerSeasonShootingStats,
  PlayerSeasonStats,
  SeasonShootingStats,
  TeamStatsLeaderboardRecord,
  TeamSeasonStats,
} from './types';
import {
  getPlayerSeasonShootingStats,
  getPlayerSeasonStats,
  getTeamLeaderboardStats,
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
   * Returns team leaderboard statistics. This endpoint requires Patreon Tier 2 access or higher.
   * @param season Filters results to the specified season.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
   */
  @Get('team/leaderboard')
  public async getTeamLeaderboardStats(
    @Query() season?: number,
    @Query() team?: string,
    @Query() conference?: string,
  ): Promise<TeamStatsLeaderboardRecord[]> {
    return await getTeamLeaderboardStats(season, team, conference);
  }

  /**
   * Returns team season statistics. Provide at least a season or team.
   * @param season Filters results to the specified season. Required when team is not provided.
   * @param seasonType Filters results to the specified season type.
   * @param team Filters results to the specified team name. Required when season is not provided.
   * @param conference Filters results to the specified conference abbreviation.
   * @param startDateRange Includes games starting at or after this ISO 8601 timestamp.
   * @param endDateRange Includes games starting at or before this ISO 8601 timestamp.
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
   * Returns team shooting statistics for a season. Provide a team or conference.
   * @param season The season to return.
   * @param seasonType Filters results to the specified season type.
   * @param team Filters results to the specified team name. Required when conference is not provided.
   * @param conference Filters results to the specified conference abbreviation. Required when team is not provided.
   * @param startDateRange Includes games starting at or after this ISO 8601 timestamp.
   * @param endDateRange Includes games starting at or before this ISO 8601 timestamp.
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
   * Returns player statistics for a season.
   * @param season The season to return.
   * @param seasonType Filters results to the specified season type.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
   * @param startDateRange Includes games starting at or after this ISO 8601 timestamp.
   * @param endDateRange Includes games starting at or before this ISO 8601 timestamp.
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
   * Returns player shooting statistics for a season. Provide a team or conference.
   * @param season The season to return.
   * @param seasonType Filters results to the specified season type.
   * @param team Filters results to the specified team name. Required when conference is not provided.
   * @param conference Filters results to the specified conference abbreviation. Required when team is not provided.
   * @param startDateRange Includes games starting at or after this ISO 8601 timestamp.
   * @param endDateRange Includes games starting at or before this ISO 8601 timestamp.
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
