import { Route, Tags, Controller, Get, Path, Query, Middlewares } from 'tsoa';
import { PlayInfo, PlayTypeInfo } from './types';
import {
  getPlaysByDate,
  getPlaysByGameId,
  getPlaysByPlayerId,
  getPlaysByTeam,
  getPlaysByTournament,
  getPlayTypes,
} from './service';

import middlewares from '../../config/middleware';

@Route('plays')
@Middlewares(middlewares.standard)
@Tags('plays')
export class PlaysController extends Controller {
  /**
   * Returns all recorded plays for a game.
   * @param gameId The game ID.
   * @param shootingPlaysOnly When true, returns only shooting plays.
   * @isInt gameId
   */
  @Get('game/{gameId}')
  public async getPlays(
    @Path() gameId: number,
    @Query() shootingPlaysOnly?: boolean,
  ): Promise<PlayInfo[]> {
    return await getPlaysByGameId(gameId, shootingPlaysOnly);
  }

  /**
   * Returns all recorded plays for a player and season.
   * @param playerId The player ID.
   * @param season The season to return.
   * @param shootingPlaysOnly When true, returns only shooting plays.
   * @isInt playerId
   * @isInt season
   */
  @Get('player/{playerId}')
  public async getPlaysByPlayerId(
    @Path() playerId: number,
    @Query() season: number,
    @Query() shootingPlaysOnly?: boolean,
  ): Promise<PlayInfo[]> {
    return await getPlaysByPlayerId(season, playerId, shootingPlaysOnly);
  }

  /**
   * Returns all recorded plays for a team and season.
   * @param season The season to return.
   * @param team The team name to return.
   * @param shootingPlaysOnly When true, returns only shooting plays.
   * @isInt season
   */
  @Get('team')
  public async getPlaysByTeam(
    @Query() season: number,
    @Query() team: string,
    @Query() shootingPlaysOnly?: boolean,
  ): Promise<PlayInfo[]> {
    return await getPlaysByTeam(season, team, shootingPlaysOnly);
  }

  /**
   * Returns all recorded plays for a UTC date.
   * @param date The date to return in ISO 8601 format (YYYY-MM-DD).
   * @param shootingPlaysOnly When true, returns only shooting plays.
   * @param utcOffset Shifts the date range by this number of hours from UTC.
   */
  @Get('date')
  public async getPlaysByDate(
    @Query() date: Date,
    @Query() shootingPlaysOnly?: boolean,
    @Query() utcOffset?: number,
  ): Promise<PlayInfo[]> {
    return await getPlaysByDate(date, shootingPlaysOnly, utcOffset);
  }

  /**
   * Returns all recorded plays for a tournament and season.
   * @param tournament The tournament to return, such as NCAA or NIT.
   * @param season The season to return.
   * @param shootingPlaysOnly When true, returns only shooting plays.
   */
  @Get('tournament')
  public async getPlaysByTournament(
    @Query() tournament: string,
    @Query() season: number,
    @Query() shootingPlaysOnly?: boolean,
  ): Promise<PlayInfo[]> {
    return await getPlaysByTournament(season, tournament, shootingPlaysOnly);
  }

  /**
   * Returns available play types and their identifiers.
   */
  @Get('types')
  public async getPlayTypes(): Promise<PlayTypeInfo[]> {
    return await getPlayTypes();
  }
}
