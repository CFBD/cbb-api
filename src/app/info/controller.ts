import { Controller, Get, Middlewares, Request, Route, Tags } from 'tsoa';

import middlewares from '../../config/middleware';
import { ApiUser } from '../../globals';
import { getUserInfo } from './service';
import { UserInfo } from './types';

@Route('info')
@Middlewares(middlewares.standard)
@Tags('info')
export class InfoController extends Controller {
  /**
   * Returns the authenticated key's advertised tier and reset time and the
   * current balance of the shared CBB and CFB monthly allowance.
   * This request consumes no calls.
   */
  @Get()
  public async getUserInfo(
    @Request() request: Express.Request & { user: ApiUser },
  ): Promise<UserInfo> {
    return getUserInfo(request.user);
  }
}
