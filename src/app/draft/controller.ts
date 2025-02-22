import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { getDraftPicks, getDraftPositions, getDraftTeams } from './service';
import { DraftPick, DraftPosition, DraftTeam } from './types';

@Route('draft')
@Middlewares(middlewares.standard)
@Tags('draft')
export class DraftController extends Controller {
  /**
   * Retrieves list of NBA teams
   */
  @Get('teams')
  public async getDraftTeams(): Promise<DraftTeam[]> {
    return await getDraftTeams();
  }

  /**
   * Retrieves list of position names for NBA draft prospects
   */
  @Get('positions')
  public async getDraftPositions(): Promise<DraftPosition[]> {
    return await getDraftPositions();
  }

  /**
   * Retrieves historical NBA draft picks
   * @param year Optional draft year filter
   * @param draftTeam Optional NBA team filter
   * @param sourceTeam Optional source team (e.g. NCAA) filter
   * @param position Optional player position abbreviation filter
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
