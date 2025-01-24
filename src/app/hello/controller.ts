import { Route, Tags, Controller, Get, Query } from 'tsoa';

@Route('hello')
@Tags('games')
export class HelloController extends Controller {
  @Get()
  public async hello(@Query() name: string): Promise<string> {
    return `Hello, ${name}!`;
  }
}
