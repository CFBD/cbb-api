import { Route, Tags, Controller, Get, Middlewares, Query } from 'tsoa';
import { ConferenceHistory, ConferenceInfo } from './types';
import { getConferenceHistory, getConferences } from './service';

import middlewares from '../../config/middleware';

@Route('conferences')
@Middlewares(middlewares.standard)
@Tags('conferences')
export class ConferencesController extends Controller {
  /**
   * Returns available conferences and their identifiers.
   */
  @Get()
  public async getConferences(): Promise<ConferenceInfo[]> {
    return await getConferences();
  }

  /**
   * Returns historical conference membership records.
   * @param conference Filters results to the specified conference abbreviation.
   */
  @Get('history')
  public async getConferenceHistory(
    @Query() conference?: string,
  ): Promise<ConferenceHistory[]> {
    return await getConferenceHistory(conference);
  }
}
