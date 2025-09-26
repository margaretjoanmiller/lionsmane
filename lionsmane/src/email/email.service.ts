import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Email } from './email';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async sendMail(email: Email) {
    await this.emailQueue.add('send-mail', {
      data: email,
    });
  }
}
