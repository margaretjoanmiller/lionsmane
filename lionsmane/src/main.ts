import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import helmet from 'helmet';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { db } from './db/index';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // better-auth will turn it back on!
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
      credentials: true,
    },
    logger: new ConsoleLogger({
      json: process.env.NODE_ENV === 'production',
    }),
  });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: [`'self'`, 'cdn.jsdelivr.net/npm/@scalar/api-reference '],
        },
      },
    }),
  );

  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Lionsmane API')
      .setDescription('the api for lionsmane')
      .setVersion('1.0')
      .addCookieAuth()
      .addBearerAuth()
      .addOAuth2()
      .addApiKey()
      .addGlobalResponse({
        status: 500,
        description: 'Internal server error',
      })
      .addGlobalResponse({
        status: 401,
        description: 'Unauthorized',
      })
      .build(),
  );

  SwaggerModule.setup('api', app, cleanupOpenApiDoc(openApiDoc));

  app.use(
    '/reference',
    apiReference({
      content: openApiDoc,
    }),
  );

  // Run migrations
  if (process.env.NODE_ENV === 'production') {
    await migrate(db, { migrationsFolder: 'drizzle' });
  }

  await app.listen(process.env.PORT ?? 8181);
}

bootstrap();
