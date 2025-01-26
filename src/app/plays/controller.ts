import { Route, Tags, Controller, Get, Path, Query, Middlewares } from 'tsoa';
import { PlayInfo, PlayTypeInfo } from './types';
import {
  getPlaysByDate,
  getPlaysByGameId,
  getPlaysByPlayerId,
  getPlaysByTeam,
  getPlayTypes,
} from './service';

import middlewares from '../../config/middleware';

@Route('plays')
@Middlewares(middlewares.standard)
@Tags('plays')
export class PlaysController extends Controller {
  /**
   * Returns all plays for a given game
   * @param gameId Game id filter
   * @isInt gameId
   */
  @Get('game/{gameId}')
  public async getPlays(@Path() gameId: number): Promise<PlayInfo[]> {
    return await getPlaysByGameId(gameId);
  }

  /**
   * Retrieve all plays for a given player and season
   * @param playerId Required player id filter
   * @param season Required season filter
   * @isInt playerId
   * @isInt season
   */
  @Get('player/{playerId}')
  public async getPlaysByPlayerId(
    @Path() playerId: number,
    @Query() season: number,
  ): Promise<PlayInfo[]> {
    return await getPlaysByPlayerId(season, playerId);
  }

  /**
   * Retrieve all plays for a given team and season
   * @param season Required season filter
   * @param team Required team filter
   * @isInt season
   */
  @Get('team')
  public async getPlaysByTeam(
    @Query() season: number,
    @Query() team: string,
  ): Promise<PlayInfo[]> {
    return await getPlaysByTeam(season, team);
  }

  /**
   * Retrieve all plays for a given UTC date
   * @param date Required date filter in ISO 8601 format (YYYY-MM-DD)
   */
  @Get('date')
  public async getPlaysByDate(@Query() date: Date): Promise<PlayInfo[]> {
    return await getPlaysByDate(date);
  }

  /**
   * Retrieve list of play types
   */
  @Get('types')
  public async getPlayTypes(): Promise<PlayTypeInfo[]> {
    return await getPlayTypes();
  }
}
