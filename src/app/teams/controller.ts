import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';
import { getTeamRoster, getTeams } from './service';
import { TeamInfo, TeamRoster } from './types';

import middlewares from '../../config/middleware';

@Route('teams')
@Middlewares(middlewares.standard)
@Tags('teams')
export class TeamsController extends Controller {
  /**
   * Returns team and conference information.
   * @param conference Filters results to the specified conference abbreviation.
   * @param season Returns conference membership for the specified season.
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
   * Returns team rosters for a season.
   * @param season The season to return.
   * @param team Filters results to the specified team name.
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
