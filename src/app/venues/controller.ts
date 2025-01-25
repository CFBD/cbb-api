import { Route, Tags, Controller, Get } from 'tsoa';
import { getVenues } from './service';
import { VenueInfo } from './types';

@Route('venues')
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
