import { Route, Tags, Controller, Get, Query, Middlewares, Path } from 'tsoa';

import middlewares from '../../config/middleware';
import { getLineupStatsByGame, getLineupStatsByTeam } from './service';
import { LineupStats } from './types';

@Route('lineups')
@Middlewares(middlewares.standard)
@Tags('lineups')
export class LineupsController extends Controller {
  /**
   * Returns lineup statistics for a team and season.
   * @param season The season to return.
   * @param team The team name to return.
   * @param startDateRange Includes games starting at or after this ISO 8601 timestamp.
   * @param endDateRange Includes games starting at or before this ISO 8601 timestamp.
   * @isInt season
   */
  @Get('team')
  public async getLineupsByTeamSeason(
    @Query() season: number,
    @Query() team: string,
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
  ): Promise<LineupStats[]> {
    return await getLineupStatsByTeam(
      season,
      team,
      startDateRange,
      endDateRange,
    );
  }

  /**
   * Returns lineup statistics for a game.
   * @param gameId The game ID.
   * @isInt gameId
   */
  @Get('game/{gameId}')
  public async getLineupStatsByGame(
    @Path() gameId: number,
  ): Promise<LineupStats[]> {
    return await getLineupStatsByGame(gameId);
  }
}
