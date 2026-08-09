import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { GameLines, LineProviderInfo } from './types';
import { getLines, getProviders } from './service';

@Route('lines')
@Middlewares(middlewares.standard)
@Tags('lines')
export class LinesController extends Controller {
  /**
   * Returns betting lines for up to 3,000 games that match the filters, ordered by start date.
   * @param season Filters results to the specified season.
   * @param team Filters results to the specified team name.
   * @param conference Filters results to the specified conference abbreviation.
   * @param startDateRange Includes games starting at or after this ISO 8601 timestamp.
   * @param endDateRange Includes games starting at or before this ISO 8601 timestamp.
   * @isInt season
   */
  @Get()
  public async getLines(
    @Query() season?: number,
    @Query() team?: string,
    @Query() conference?: string,
    @Query() startDateRange?: Date,
    @Query() endDateRange?: Date,
  ): Promise<GameLines[]> {
    return await getLines(
      season,
      team,
      conference,
      startDateRange,
      endDateRange,
    );
  }

  /**
   * Returns available betting line providers.
   */
  @Get('providers')
  public async getProviders(): Promise<LineProviderInfo[]> {
    return await getProviders();
  }
}
