import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { db } from './db/index';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // better-auth will turn it back on!
  });

  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Lionsmane API')
      .setDescription('the api for lionsmane')
      .setVersion('1.0')
      .addCookieAuth()
      .addBearerAuth()
      .addOAuth2()
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
  await migrate(db, { migrationsFolder: 'drizzle' });

  await app.listen(process.env.PORT ?? 8181);
}

bootstrap();
