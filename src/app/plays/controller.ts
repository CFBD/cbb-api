import { Route, Tags, Controller, Get, Path, Query } from 'tsoa';
import { PlayInfo } from './types';
import { getPlaysByDate, getPlaysByGameId, getPlaysByTeam } from './service';

@Route('plays')
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
}
