import { Route, Tags, Controller, Get, Middlewares } from 'tsoa';
import { ConferenceInfo } from './types';
import { getConferences } from './service';

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
}
