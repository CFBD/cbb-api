import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { Recruit, TeamRecruitingRanking, Transfer } from './types';
import { getRecruits, getTeamRankings, getTransfers } from './service';

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

  /**
   * Retrieves historical transfer portal activity
   * @param season Season filter
   * @param sourceTeam Source team filter
   * @param destinationTeam Destination team filter
   * @param sourceConference Source conference filter
   * @param destinationConference Destination conference filter
   * @param position Position filter
   * @isInt season
   */
  @Get('portal')
  public async getPortalTransfers(
    @Query() year?: number,
    @Query() sourceTeam?: string,
    @Query() destinationTeam?: string,
    @Query() sourceConference?: string,
    @Query() destinationConference?: string,
    @Query() position?: string,
  ): Promise<Transfer[]> {
    return await getTransfers(
      year,
      sourceTeam,
      destinationTeam,
      sourceConference,
      destinationConference,
      position,
    );
  }
}
