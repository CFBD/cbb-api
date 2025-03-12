import { Route, Tags, Controller, Get, Query, Middlewares, Path } from 'tsoa';

import middlewares from '../../config/middleware';
import { getLineupStatsByGame, getLineupStatsByTeam } from './service';
import { LineupStats } from './types';

@Route('lineups')
@Middlewares(middlewares.standard)
@Tags('lineups')
export class LineupsController extends Controller {
  /**
   * Queries lineup statistics for a given team and season
   * @param season Required season filter
   * @param team Required team filter
   * @param startDateRange Optional start date range filter
   * @param endDateRange Optional end date range filter
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
   * Queries lineup statistics for a specific game
   * @param gameId Required game id filter
   * @isInt gameId
   */
  @Get('game/{gameId}')
  public async getLineupStatsByGame(
    @Path() gameId: number,
  ): Promise<LineupStats[]> {
    return await getLineupStatsByGame(gameId);
  }
}
