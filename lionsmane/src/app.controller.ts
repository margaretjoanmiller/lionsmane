import { Controller, Get } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

@Controller()
export class AppController {
  @Get('me')
  getProfile(@Session() session: UserSession) {
    return session;
  }
}
