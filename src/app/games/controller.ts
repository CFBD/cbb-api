import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';
import {
  getBroadcasts,
  getGamePlayerStatistics,
  getGames,
  getGameTeamStatistics,
} from './service';
import {
  GameBoxScorePlayers,
  GameBoxScoreTeam,
  GameInfo,
  GameMediaInfo,
} from './types';
import { GameStatus, SeasonType } from '../enums';

import middlewares from '../../config/middleware';

@Route('games')
@Middlewares(middlewares.standard)
@Tags('games')
export class GamesController extends Controller {
  /**
   * Returns information on the first 3000 games that match the provided filters, ordered by start date.
   * @param startDateRange Optional start timestamp in ISO 8601 format
   * @param endDateRange Optional end timestamp in ISO 8601 format
   * @param team Optional team name filter
   * @param conference Optional conference abbreviation filter
   * @param season Optional season filter
   * @param seasonType Optional season type filter
   * @param status Optional game status filter
   * @isInt season
   */
  @Get()
  public async getGames(
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() season?: number,
    @Query() seasonType?: SeasonType,
    @Query() status?: GameStatus,
  ): Promise<GameInfo[]> {
    return await getGames(
      startDateRange,
      endDateRange,
      team,
      conference,
      season,
      seasonType,
      status,
    );
  }

  /**
   * Returns broadcast information on the first 3000 games that match the provided filters, ordered by start date.
   * @param startDateRange Optional start timestamp in ISO 8601 format
   * @param endDateRange Optional end timestamp in ISO 8601 format
   * @param team Optional team name filter
   * @param conference Optional conference abbreviation filter
   * @param season Optional season filter
   * @param seasonType Optional season type filter
   */
  @Get('media')
  public async getBroadcasts(
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() season?: number,
    @Query() seasonType?: SeasonType,
  ): Promise<GameMediaInfo[]> {
    return await getBroadcasts(
      startDateRange,
      endDateRange,
      team,
      conference,
      season,
      seasonType,
    );
  }

  /**
   * Returns team box score statistics and metrics on the first 3000 games that match the provided filters, ordered by start date.
   * @param startDateRange Optional start timestamp in ISO 8601 format
   * @param endDateRange Optional end timestamp in ISO 8601 format
   * @param team Optional team name filter
   * @param conference Optional conference abbreviation filter
   * @param season Optional season filter
   * @param seasonType Optional season type filter
   */
  @Get('teams')
  public async getGameTeams(
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() season?: number,
    @Query() seasonType?: SeasonType,
  ): Promise<GameBoxScoreTeam[]> {
    return await getGameTeamStatistics(
      startDateRange,
      endDateRange,
      team,
      conference,
      season,
      seasonType,
    );
  }

  /**
   * Returns player box score statistics and metrics on the first 1000 games that match the provided filters, ordered by start date.
   * @param startDateRange Optional start timestamp in ISO 8601 format
   * @param endDateRange Optional end timestamp in ISO 8601 format
   * @param team Optional team name filter
   * @param conference Optional conference abbreviation filter
   * @param season Optional season filter
   * @param seasonType Optional season type filter
   */
  @Get('players')
  public async getGamePlayers(
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() season?: number,
    @Query() seasonType?: SeasonType,
  ): Promise<GameBoxScorePlayers[]> {
    return await getGamePlayerStatistics(
      startDateRange,
      endDateRange,
      team,
      conference,
      season,
      seasonType,
    );
  }
}
