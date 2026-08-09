import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { getDraftPicks, getDraftPositions, getDraftTeams } from './service';
import { DraftPick, DraftPosition, DraftTeam } from './types';

@Route('draft')
@Middlewares(middlewares.standard)
@Tags('draft')
export class DraftController extends Controller {
  /**
   * Returns NBA teams represented in the draft data.
   */
  @Get('teams')
  public async getDraftTeams(): Promise<DraftTeam[]> {
    return await getDraftTeams();
  }

  /**
   * Returns player positions represented in the draft data.
   */
  @Get('positions')
  public async getDraftPositions(): Promise<DraftPosition[]> {
    return await getDraftPositions();
  }

  /**
   * Returns historical NBA draft picks.
   * @param year Filters results to the specified draft year.
   * @param draftTeam Filters results to the specified NBA team.
   * @param sourceTeam Filters results to the specified college team.
   * @param position Filters results to the specified player position abbreviation.
   * @isInt year
   */
  @Get('picks')
  public async getDraftPicks(
    @Query() year?: number,
    @Query() draftTeam?: string,
    @Query() sourceTeam?: string,
    @Query() position?: string,
  ): Promise<DraftPick[]> {
    return await getDraftPicks(year, draftTeam, sourceTeam, position);
  }
}
