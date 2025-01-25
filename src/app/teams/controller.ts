import { Route, Tags, Controller, Get, Query } from 'tsoa';
import { getTeams } from './service';
import { TeamInfo } from './types';

@Route('teams')
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
}
