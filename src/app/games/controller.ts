import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';
import {
  getBroadcasts,
  getGamePlayerStatistics,
  getGames,
  getGameTeamStatistics,
  getScoreboard,
} from './service';
import {
  GameBoxScorePlayers,
  GameBoxScoreTeam,
  GameInfo,
  GameMediaInfo,
  ScoreboardGame,
} from './types';
import { GameStatus, SeasonType } from '../enums';

import middlewares from '../../config/middleware';

@Route('games')
@Middlewares(middlewares.standard)
@Tags('games')
export class GamesController extends Controller {
  /**
   * Returns up to 3,000 games that match the filters, ordered by start date.
   * @param startDateRange Includes games starting at or after this ISO 8601 timestamp.
   * @param endDateRange Includes games starting at or before this ISO 8601 timestamp.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
   * @param season Filters results to the specified season.
   * @param seasonType Filters results to the specified season type.
   * @param status Filters results to the specified game status.
   * @param tournament Filters results to the specified tournament, such as NCAA or NIT.
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
    @Query() tournament?: string,
  ): Promise<GameInfo[]> {
    return await getGames(
      startDateRange,
      endDateRange,
      team,
      conference,
      season,
      seasonType,
      status,
      tournament,
    );
  }

  /**
   * Returns broadcast records for up to 3,000 games that match the filters, ordered by start date.
   * @param startDateRange Includes games starting at or after this ISO 8601 timestamp.
   * @param endDateRange Includes games starting at or before this ISO 8601 timestamp.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
   * @param season Filters results to the specified season.
   * @param seasonType Filters results to the specified season type.
   * @param tournament Filters results to the specified tournament, such as NCAA or NIT.
   */
  @Get('media')
  public async getBroadcasts(
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() season?: number,
    @Query() seasonType?: SeasonType,
    @Query() tournament?: string,
  ): Promise<GameMediaInfo[]> {
    return await getBroadcasts(
      startDateRange,
      endDateRange,
      team,
      conference,
      season,
      seasonType,
      tournament,
    );
  }

  /**
   * Returns team box scores and advanced metrics for up to 3,000 games that match the filters, ordered by start date.
   * @param startDateRange Includes games starting at or after this ISO 8601 timestamp.
   * @param endDateRange Includes games starting at or before this ISO 8601 timestamp.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
   * @param season Filters results to the specified season.
   * @param seasonType Filters results to the specified season type.
   * @param tournament Filters results to the specified tournament, such as NCAA or NIT.
   */
  @Get('teams')
  public async getGameTeams(
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() season?: number,
    @Query() seasonType?: SeasonType,
    @Query() tournament?: string,
  ): Promise<GameBoxScoreTeam[]> {
    return await getGameTeamStatistics(
      startDateRange,
      endDateRange,
      team,
      conference,
      season,
      seasonType,
      tournament,
    );
  }

  /**
   * Returns player box scores and advanced metrics for up to 1,000 games that match the filters, ordered by start date.
   * @param startDateRange Includes games starting at or after this ISO 8601 timestamp.
   * @param endDateRange Includes games starting at or before this ISO 8601 timestamp.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
   * @param season Filters results to the specified season.
   * @param seasonType Filters results to the specified season type.
   * @param tournament Filters results to the specified tournament, such as NCAA or NIT.
   */
  @Get('players')
  public async getGamePlayers(
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() season?: number,
    @Query() seasonType?: SeasonType,
    @Query() tournament?: string,
  ): Promise<GameBoxScorePlayers[]> {
    return await getGamePlayerStatistics(
      startDateRange,
      endDateRange,
      team,
      conference,
      season,
      seasonType,
      tournament,
    );
  }
}

@Route('scoreboard')
@Middlewares(middlewares.standard)
@Tags('games')
export class ScoreboardController extends Controller {
  /**
   * Returns live scoreboard data. This endpoint requires Patreon Tier 1 access or higher.
   * @param conference Filters results to the specified conference abbreviation.
   */
  @Get()
  public async getScoreboard(
    @Query() conference?: string,
  ): Promise<ScoreboardGame[]> {
    return await getScoreboard(conference);
  }
}
