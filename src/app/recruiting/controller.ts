import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { Recruit, TeamRecruitingRanking, Transfer } from './types';
import { getRecruits, getTeamRankings, getTransfers } from './service';

@Route('recruiting')
@Middlewares(middlewares.standard)
@Tags('recruiting')
export class RecruitingController extends Controller {
  /**
   * Returns historical composite player recruiting rankings and ratings.
   * @param year Filters results to the specified recruiting year.
   * @param team Filters results to the specified college team.
   * @param conference Filters results to the specified conference abbreviation.
   * @param position Filters results to the specified player position.
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
   * Returns historical composite team recruiting rankings.
   * @param year Filters results to the specified recruiting year.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
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
   * Returns historical transfer portal activity.
   * @param year Filters results to the specified transfer season.
   * @param sourceTeam Filters results to the specified source team.
   * @param destinationTeam Filters results to the specified destination team.
   * @param sourceConference Filters results to the specified source conference abbreviation.
   * @param destinationConference Filters results to the specified destination conference abbreviation.
   * @param position Filters results to the specified player position.
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
