import { Route, Tags, Controller, Get, Path, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { PlayerSubsititution } from './types';
import { getSubsByGameId, getSubsByPlayerId, getSubsByTeam } from './service';

@Route('substitutions')
@Middlewares(middlewares.standard)
@Tags('plays')
export class SubstitutionssController extends Controller {
  /**
   * Returns all player substitutions for a given game
   * @param gameId Game id filter
   * @isInt gameId
   */
  @Get('game/{gameId}')
  public async getSubstitutionsByGame(
    @Path() gameId: number,
  ): Promise<PlayerSubsititution[]> {
    return await getSubsByGameId(gameId);
  }

  /**
   * Retrieve all player substitutions for a given player and season
   * @param playerId Required player id filter
   * @param season Required season filter
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
   * Retrieve all player substitutions for a given team and season
   * @param season Required season filter
   * @param team Required team filter
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
