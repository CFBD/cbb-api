import { Route, Tags, Controller, Get } from 'tsoa';
import { ConferenceInfo } from './types';
import { getConferences } from './service';

@Route('conferences')
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
