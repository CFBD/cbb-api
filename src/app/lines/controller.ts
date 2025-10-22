import { Route, Tags, Controller, Get, Query, Middlewares } from 'tsoa';

import middlewares from '../../config/middleware';
import { GameLines, LineProviderInfo } from './types';
import { getLines, getProviders } from './service';

@Route('lines')
@Middlewares(middlewares.standard)
@Tags('lines')
export class LinesController extends Controller {
  /**
   * Returns betting lines for the first 3000 games that match the provided filters, ordered by start date.
   * @param season Optional season filter
   * @param team Optional team name filter
   * @param conference Optional conference abbreviation filter
   * @param startDateRange Optional start timestamp in ISO 8601 format
   * @param endDateRange Optional end timestamp in ISO 8601 format
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
   * Returns a list of available line providers
   */
  @Get('providers')
  public async getProviders(): Promise<LineProviderInfo[]> {
    return await getProviders();
  }
}
