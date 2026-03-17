import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { Recruit, TeamRecruitingRanking } from './types';
import { getRecruits, getTeamRankings } from './service';

@Route('recruiting')
@Middlewares(middlewares.standard)
@Tags('recruiting')
export class RecruitingController extends Controller {
  /**
   * Retrieves historical composite player recruiting ranking and ratings
   * @param year Optional year filter
   * @param team Optional college team filter
   * @param conference Optional college conference filter
   * @param position Optional position filter
   * @isInt year
   */
  @Get('players')
  public async getRecruits(
    @Query() year?: number,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() position?: string,
  ): Promise<Recruit[]> {
    return await getRecruits(year, team, conference, position);
  }

  /**
   * Retrieves historical composite team recruiting rankings
   * @param year Optional year filter
   * @param team Optional team filter
   * @param conference Optional conference abbreviation filter
   * @isInt year
   */
  @Get('teams')
  public async getTeamRecruitingRankings(
    @Query() year?: number,
    @Query() team?: string,
    @Query() conference?: string,
  ): Promise<TeamRecruitingRanking[]> {
    return await getTeamRankings(year, team, conference);
  }
}
