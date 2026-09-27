import {
  Route,
  Controller,
  Hidden,
  Options,
  Post,
  Body,
  NoSecurity,
} from 'tsoa';
import { generateApiKey } from './service';

@Route('auth')
export class AuthController extends Controller {
  @Options('key')
  @Hidden()
  @NoSecurity()
  public async requestApiKeyOptions() {
    this.setStatus(200);
  }

  @Post('key')
  @Hidden()
  @NoSecurity()
  public async requestApiKey(@Body() body: { email: string }) {
    await generateApiKey(body.email);
    this.setStatus(200);
  }
}
