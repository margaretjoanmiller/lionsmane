import 'dotenv/config';
import { createKeyv } from '@keyv/redis';
import { DrizzlePGModule } from '@knaadh/nestjs-drizzle-pg';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import {
  ArgumentsHost,
  Catch,
  HttpException,
  Logger,
  Module,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  APP_PIPE,
  BaseExceptionFilter,
} from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import {
  ZodSerializationException,
  ZodSerializerInterceptor,
  ZodValidationPipe,
} from 'nestjs-zod';
import { ZodError } from 'zod';
import { AppController } from './app.controller';
import { ArticleModule } from './article/article.module';
import { auth } from './auth';
import { CronModule } from './cron/cron.module';
import * as authSchema from './db/schema/auth';
import * as coreSchema from './db/schema/core';
import { EmailModule } from './email/email.module';
import { FeedModule } from './feed/feed.module';
import { FetcherModule } from './fetcher/fetcher.module';
import { FilterModule } from './filter/filter.module';
import { FolderModule } from './folder/folder.module';
import { HealthModule } from './health/health.module';
import { OpmlModule } from './opml/opml.module';
import { ReadlaterModule } from './readlater/readlater.module';
import { RedisModule } from './redis/redis.module';
import { SecretsModule } from './secrets/secrets.module';
import { MinifluxModule } from './miniflux/miniflux.module';

@Catch(HttpException)
class HttpExceptionFilter extends BaseExceptionFilter {
  private logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError();

      if (zodError instanceof ZodError) {
        this.logger.error(`ZodSerializationException: ${zodError.message}`);
      }
    }

    super.catch(exception, host);
  }
}

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue(
      { name: 'feed' },
      { name: 'article' },
      { name: 'filter' },
    ),
    AuthModule.forRoot(auth),
    DrizzlePGModule.register({
      tag: 'DB',
      pg: {
        connection: 'pool',
        config: {
          connectionString: process.env.DATABASE_URL!,
        },
      },
      config: { schema: { ...authSchema, ...coreSchema } },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        return {
          stores: [createKeyv('redis://localhost:6379')],
          ttl: 5000,
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    FetcherModule,
    FeedModule,
    ArticleModule,
    FolderModule,
    RedisModule,
    CronModule,
    FilterModule,
    OpmlModule,
    HealthModule,
    ReadlaterModule,
    SecretsModule,
    EmailModule,
    MinifluxModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
