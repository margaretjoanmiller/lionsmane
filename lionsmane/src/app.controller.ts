import { Controller, Get, Redirect } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

@Controller()
export class AppController {
  @Get('me')
  getProfile(@Session() session: UserSession) {
    return session;
  }

  @Get('callback')
  @Redirect(
    process.env.FRONTEND_URL || 'http://localhost:3000' + '/dashboard',
    302,
  )
  getLogin() {
    return;
  }
}
