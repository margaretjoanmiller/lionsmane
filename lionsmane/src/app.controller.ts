import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('me')
  async getProfile(@Session() session: UserSession) {
    return session;
  }
}
