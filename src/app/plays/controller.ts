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
   * Returns all plays for a given game
   * @param gameId Game id filter
   * @param shootingPlaysOnly Optional filter to only return shooting plays
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
   * Retrieve all plays for a given player and season
   * @param playerId Required player id filter
   * @param season Required season filter
   * @param shootingPlaysOnly Optional filter to only return shooting plays
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
   * Retrieve all plays for a given team and season
   * @param season Required season filter
   * @param team Required team filter
   * @param shootingPlaysOnly Optional filter to only return shooting plays
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
   * Retrieve all plays for a given UTC date
   * @param date Required date filter in ISO 8601 format (YYYY-MM-DD)
   * @param shootingPlaysOnly Optional filter to only return shooting plays
   */
  @Get('date')
  public async getPlaysByDate(
    @Query() date: Date,
    @Query() shootingPlaysOnly?: boolean,
  ): Promise<PlayInfo[]> {
    return await getPlaysByDate(date, shootingPlaysOnly);
  }

  /**
   * Retrieve all plays for a given tournament and season
   * @param tournament Required tournament filter (e.g. NCAA, NIT, etc)
   * @param season Required season filter
   * @param shootingPlaysOnly Optional filter to only return shooting plays
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
   * Retrieve list of play types
   */
  @Get('types')
  public async getPlayTypes(): Promise<PlayTypeInfo[]> {
    return await getPlayTypes();
  }
}
