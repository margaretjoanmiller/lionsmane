import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import nodemailer, { SentMessageInfo, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Email } from './email';

@Processor('email')
export class EmailConsumer extends WorkerHost {
  private transporter: Transporter<SentMessageInfo, SMTPTransport.Options>;
  private fromAddr: string;

  private readonly logger = new Logger(EmailConsumer.name);

  constructor(private config: ConfigService) {
    super();
    // Create a transporter for SMTP
    this.fromAddr = this.config.getOrThrow<string>('FROM_ADDR');
    const host = this.config.getOrThrow<string>('SMTP_HOST');
    const user = this.config.getOrThrow<string>('SMTP_USER');
    const password = this.config.getOrThrow<string>('SMTP_PASS');
    this.transporter = nodemailer.createTransport({
      host,
      port: 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: user,
        pass: password,
      },
    });
  }
  async process(job: Job<Email>) {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddr,
        to: job.data.targetAddr,
        subject: job.data.subject,
        text: job.data.payload,
      });
      this.logger.log(`Send message: ${info.messageId}`);
    } catch (error) {
      this.logger.error('Error sending mail', error);
      throw Error('Error sending mail', { cause: error });
    }
  }
}
