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
import * as authSchema from './db/schema/auth';
import * as coreSchema from './db/schema/core';
import { DrizzlePGModule } from '@knaadh/nestjs-drizzle-pg';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth';

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
    AuthModule.forRoot(auth),
    DrizzlePGModule.register({
      tag: 'DB',
      pg: {
        connection: 'pool',
        config: {
          connectionString: process.env.DATABASE_URL!,
        },
      },
      config: { schema: { ...authSchema, ...coreSchema }, logger: true },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
