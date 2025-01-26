import { Route, Tags, Controller, Get, Middlewares } from 'tsoa';
import { getVenues } from './service';
import { VenueInfo } from './types';

import middlewares from '../../config/middleware';

@Route('venues')
@Middlewares(middlewares.standard)
@Tags('venues')
export class VenuesController extends Controller {
  /**
   * Retrieves list of available venues
   */
  @Get()
  public async getVenues(): Promise<VenueInfo[]> {
    return await getVenues();
  }
}
