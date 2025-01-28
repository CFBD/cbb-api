import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';
import { getTeamRoster, getTeams } from './service';
import { TeamInfo, TeamRoster } from './types';

import middlewares from '../../config/middleware';

@Route('teams')
@Middlewares(middlewares.standard)
@Tags('teams')
export class TeamsController extends Controller {
  /**
   * Retrieves historical team information
   * @param conference Optional conference filter
   * @param season Optional season filter
   * @isInt season
   */
  @Get()
  public async getTeams(
    @Query() conference?: string,
    @Query() season?: number,
  ): Promise<TeamInfo[]> {
    return await getTeams(conference, season);
  }

  /**
   * Retrieves team roster information
   * @param season Season filter
   * @param team Optional team filter
   * @isInt season
   */
  @Get('roster')
  public async getTeamRoster(
    @Query() season: number,
    @Query() team?: string,
  ): Promise<TeamRoster[]> {
    return await getTeamRoster(season, team);
  }
}
