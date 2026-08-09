import { Route, Tags, Controller, Get, Path, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { PlayerSubsititution } from './types';
import { getSubsByGameId, getSubsByPlayerId, getSubsByTeam } from './service';

@Route('substitutions')
@Middlewares(middlewares.standard)
@Tags('plays')
export class SubstitutionsController extends Controller {
  /**
   * Returns all recorded player substitutions for a game.
   * @param gameId The game ID.
   * @isInt gameId
   */
  @Get('game/{gameId}')
  public async getSubstitutionsByGame(
    @Path() gameId: number,
  ): Promise<PlayerSubsititution[]> {
    return await getSubsByGameId(gameId);
  }

  /**
   * Returns all recorded player substitutions for a player and season.
   * @param playerId The player ID.
   * @param season The season to return.
   * @isInt playerId
   * @isInt season
   */
  @Get('player/{playerId}')
  public async getSubstitutionsByPlayerId(
    @Path() playerId: number,
    @Query() season: number,
  ): Promise<PlayerSubsititution[]> {
    return await getSubsByPlayerId(season, playerId);
  }

  /**
   * Returns all recorded player substitutions for a team and season.
   * @param season The season to return.
   * @param team The team name to return.
   * @isInt season
   */
  @Get('team')
  public async getSubstitutionsByTeam(
    @Query() season: number,
    @Query() team: string,
  ): Promise<PlayerSubsititution[]> {
    return await getSubsByTeam(season, team);
  }
}
