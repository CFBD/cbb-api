import { Route, Tags, Controller, Get, Query } from 'tsoa';
import { getGames } from './service';

@Route('games')
@Tags('games')
export class GamesController extends Controller {
  @Get()
  public async hello(@Query() startDateRange?: Date) {
    return await getGames(startDateRange);
  }
}
