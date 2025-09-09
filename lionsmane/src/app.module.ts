import 'dotenv/config';
import {
  ZodValidationPipe,
  ZodSerializerInterceptor,
  ZodSerializationException,
} from 'nestjs-zod';
import {
  APP_PIPE,
  APP_INTERCEPTOR,
  APP_FILTER,
  BaseExceptionFilter,
  APP_GUARD,
} from '@nestjs/core';
import { ZodError } from 'zod';
import {
  Module,
  HttpException,
  ArgumentsHost,
  Logger,
  Catch,
} from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import * as authSchema from './db/schema/auth';
import * as coreSchema from './db/schema/core';
import { DrizzlePGModule } from '@knaadh/nestjs-drizzle-pg';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { AppController } from './app.controller';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth';
import { FetcherModule } from './fetcher/fetcher.module';
import { FeedModule } from './feed/feed.module';
import { ArticleModule } from './article/article.module';
import { FolderModule } from './folder/folder.module';
import { RedisModule } from './redis/redis.module';
import { CronModule } from './cron/cron.module';
import { FilterModule } from './filter/filter.module';

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
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue(
      { name: 'feed' },
      { name: 'article' },
      { name: 'filter' },
    ),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'feed',
      adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
    }),
    BullBoardModule.forFeature({
      name: 'article',
      adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
    }),
    BullBoardModule.forFeature({
      name: 'filter',
      adapter: BullMQAdapter, //or use BullAdapter if you're using bull instead of bullMQ
    }),
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
      useFactory: async () => {
        return {
          stores: [createKeyv('redis://localhost:6379')],
        };
      },
    }),
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
  ],
})
export class AppModule {}
