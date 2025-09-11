import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';

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

  await app.listen(process.env.PORT ?? 8181);
}
bootstrap();
