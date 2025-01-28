import { Route, Tags, Controller, Get, Middlewares, Query } from 'tsoa';
import { ConferenceHistory, ConferenceInfo } from './types';
import { getConferenceHistory, getConferences } from './service';

import middlewares from '../../config/middleware';

@Route('conferences')
@Middlewares(middlewares.standard)
@Tags('conferences')
export class ConferencesController extends Controller {
  /**
   * Retrieves list of available conferences
   */
  @Get()
  public async getConferences(): Promise<ConferenceInfo[]> {
    return await getConferences();
  }

  /**
   * Retrieves historical conference membership information
   * @param conference Optional conference abbreviation filter
   */
  @Get('history')
  public async getConferenceHistory(
    @Query() conference?: string,
  ): Promise<ConferenceHistory[]> {
    return await getConferenceHistory(conference);
  }
}
